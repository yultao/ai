import fs from 'fs';
import * as path from 'path';
type SlackMessage = {
  ts: string;
  thread_ts?: string;
  text: string;
  [key: string]: any;
  replies: SlackMessage[]
};

export class SlackDownloader {

  constructor() { }
  /**
   * Remove JSON content inside cached_latest_updates form-data
   */
  stripCachedLatestUpdatesBody(body: string): string {
    return body.replace(
      /(name=\\"cached_latest_updates\\"\\r\\n\\r\\n)\{[^}]*\}/,
      '$1{}'
    );
  }

  private deduplicateByTS(messages: SlackMessage[]): SlackMessage[] {
    const seen = new Set<string>();
    return messages.filter((msg) => {
      if (seen.has(msg.ts)) {
        return false;
      }
      seen.add(msg.ts);
      return true;
    });
  }

  /**
   * Parse and execute fetch calls from the requests.txt file
   */
  async runRequestsFromFile(filePath: string) {
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
          const cleanedBody = this.stripCachedLatestUpdatesBody(originalBody);

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

    //step 2: clean
    console.log('clean');
    for (const msg of allMessages) {
      delete msg.blocks;
      delete msg.bot_profile;
    }

    //step 3: uniqueMessages
    console.log('dedup');
    const uniqueMessages = this.deduplicateByTS(allMessages);

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

    //step 4: sortedMessages
    console.log('sort');
    const sortedMessages = messagesWithReplies.sort((a, b) => Number(a.ts) - Number(b.ts));
    for (const msg of messagesWithReplies) {
      if (msg.replies) {
        msg.replies.sort((a, b) => Number(a.ts) - Number(b.ts))
      }
    }
    return sortedMessages;
    // await fs.promises.writeFile(filePath + ".json", JSON.stringify(sortedMessages, null, 2), 'utf-8');
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

        this.writeFile(dir, messages!);
      }
    }

  }

}

const down = new SlackDownloader();
// await down.runRequestsFromFile("conversations/request/all-tt/request.js");
await down.readAllFilesRecursive("conversations/request");