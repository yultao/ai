import fs from 'fs';
import * as path from 'path';
import { SlackMessage, loadMessagesByTs } from './slack-common.js';


export class SlackDownloader {

  constructor() { }



  /**
   * Parse and execute fetch calls from the requests.txt file
   */
  async runRequestsFromFile(filePath: string) {
    function stripCachedLatestUpdatesBody(body: string): string {
      return body.replace(
        /(name=\\"cached_latest_updates\\"\\r\\n\\r\\n)\{[^}]*\}/,
        '$1{}'
      );
    }
    const raw = await fs.promises.readFile(filePath, 'utf-8');

    // Match each fetch(...) block
    const fetchBlocks = raw.match(/fetch\([^]*?\}\)/g);
    if (!fetchBlocks) {
      console.error('No fetch blocks found.');
      return;
    }

    //step 1: read all raw messages
    const allMessages: SlackMessage[] = [];
    // const msgs =[];
    for (const fetchCall of fetchBlocks) {
      try {
        // Safely rewrite body part if cached_latest_updates exists
        const bodyMatch = fetchCall.match(/"body":\s*?"([^]*?)",\s*"method":/);
        if (bodyMatch) {
          const originalBody = bodyMatch[1];
          const cleanedBody = stripCachedLatestUpdatesBody(originalBody);

          // Replace in the fetch string
          const cleanedFetch = fetchCall.replace(originalBody, cleanedBody);
          // console.log('Executing request... ' + cleanedFetch);

          const res = await eval(`(async () => ${cleanedFetch})()`);
          const json = await res.json();
          console.log('✅ Result:', json.ok ? 'OK' : json.error);

          // console.log(JSON.stringify(json))
          if (json.history) {
            allMessages.push(...json.history.messages);
          } else if (json.messages) {
            allMessages.push(...json.messages);
          } else {
            console.error('❌ Result: IGNORE');
          }

        } else {
          console.warn('Skipping fetch: no body found.');
        }
      } catch (err) {
        console.error('❌ Failed request:', err);
      }
    }
    return allMessages;
    // await fs.promises.writeFile(filePath + ".json", JSON.stringify(sortedMessages, null, 2), 'utf-8');
  }

  async postProcess(channelPath: string, allMessages: SlackMessage[]) {
    function deduplicateByTS(messages: SlackMessage[]): SlackMessage[] {
      const seen = new Set<string>();
      return messages.filter((msg) => {
        if (seen.has(msg.ts)) {
          return false;
        }
        seen.add(msg.ts);
        return true;
      });
    }

    function deepMerge(obj1: SlackMessage, obj2: SlackMessage): SlackMessage {
      const result: SlackMessage = { ...obj1 };

      for (const key in obj2) {
        const val1 = obj1[key];
        const val2 = obj2[key];

        if (Array.isArray(val1) && Array.isArray(val2)) {
          if (key === 'replies') {
            // 合并 replies，按 ts 去重
            const oldMap = new Map<string, any>();
            val1.forEach((item: any) => {
              if (item.ts) oldMap.set(item.ts, { ...item });
            });

            const merged: any[] = [];

            const seen = new Set<string>();
            val2.forEach((item: any) => {
              if (!item.ts) return;
              const oldItem = oldMap.get(item.ts);
              if (oldItem) {
                merged.push({ ...item, updated: true });
                oldMap.delete(item.ts); // 已处理，移除
              } else {
                merged.push(item); // 新增项
              }
              seen.add(item.ts);
            });

            // 剩下的是旧的，但没在新中出现 → 标记为 deleted
            for (const [ts, oldItem] of oldMap.entries()) {
              merged.push({ ...oldItem, deleted: true });
            }

            result[key] = merged;
          } else {
            result[key] = [...val1, ...val2];
          }
        } else if (
          typeof val1 === 'object' &&
          typeof val2 === 'object' &&
          val1 !== null &&
          val2 !== null &&
          !Array.isArray(val1) &&
          !Array.isArray(val2)
        ) {
          result[key] = deepMerge(val1, val2);
        } else {
          result[key] = val2;
        }
      }

      return result;
    }

    channelPath = channelPath.replace("request", "history");

    //step 2: clean
    console.log('clean');
    for (const msg of allMessages) {
      delete msg.blocks;
      delete msg.bot_profile;
    }

    //step 3: uniqueMessages
    console.log('dedup');
    const uniqueMessages = deduplicateByTS(allMessages);


    console.log('k-v');
    const messageMap: Record<string, SlackMessage> = {};
    for (const msg of uniqueMessages) {
      if (msg.ts) {
        messageMap[msg.ts] = msg;
      }
    }

    console.log('restructure');
    const messagesWithReplies: SlackMessage[] = [];
    for (const msg of uniqueMessages) {
      if (msg.thread_ts && msg.thread_ts != msg.ts) {//replies
        const pa = messageMap[msg.thread_ts];

        if (!pa.replies) {
          pa.replies = [];
        };

        //console.log("push rep "+msg.ts+", "+msg.thread_ts+": "+pa.ts+", "+pa.thread_ts+", "+pa.replies)

        pa.replies.push(msg);
      } else {
        //console.log("push top "+msg.ts+", "+msg.thread_ts)
        messagesWithReplies.push(msg);
      }
    }


    const mergedMessages = [];

    const existingMessages = await loadMessagesByTs(channelPath);
    console.log("merge");
    for (const msg of messagesWithReplies) {
      if (msg.ts) {
        const existing = existingMessages[msg.ts];
        if (existing) {
          // const merged = { ...existing, ...msg };
          const merged = deepMerge(existing, msg);

          mergedMessages.push(merged);
        } else {
          mergedMessages.push(msg);
        }
      }
    }

    //step 4: sortedMessages
    console.log('sort');
    const sortedMessages = mergedMessages.sort((a, b) => Number(a.ts) - Number(b.ts));
    for (const msg of mergedMessages) {
      if (msg.replies) {
        msg.replies.sort((a, b) => Number(a.ts) - Number(b.ts))
      }
    }
    return sortedMessages;
  }

  async writeFile(dir: string, messages: SlackMessage[]): Promise<void> {
    dir = dir.replace("request", "history");
    function formatTsToDate(ts: string): string {
      const date = new Date(parseFloat(ts) * 1000);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}${mm}${dd}`;
    }

    // 主函数：按日期分组并保存为文件
    function splitMessagesByDate(messages: SlackMessage[]) {
      const grouped: Record<string, SlackMessage[]> = {};

      for (const msg of messages) {
        const dateKey = formatTsToDate(msg.ts);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(msg);
      }

      // 保存为单独的 JSON 文件
      for (const [date, msgs] of Object.entries(grouped)) {
        const filePath = path.join(dir, `${date}.json`);
        fs.writeFileSync(filePath, JSON.stringify(msgs, null, 2), "utf-8");
        console.log(`✅ Saved ${msgs.length} messages to ${filePath}`);
      }
    }
    splitMessagesByDate(messages);
  }
  public async readAllFilesRecursive(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.readAllFilesRecursive(fullPath)
      } else if (entry.isFile()) {
        console.log(fullPath)
        const messages = await this.runRequestsFromFile(fullPath);
        const processedMessages = await this.postProcess(dir, messages!);
        this.writeFile(dir, processedMessages);
      }
    }

  }

}

const down = new SlackDownloader();
// await down.runRequestsFromFile("conversations/request/all-tt/request.js");
await down.readAllFilesRecursive("conversations/request/all-tt");