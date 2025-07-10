import Bolt from '@slack/bolt';
import dotenv from 'dotenv';
import { WebAPICallResult } from '@slack/web-api';

import * as fs from 'fs/promises';
import * as path from 'path';
dotenv.config();

interface SlackMessageResult {
  content: { type: string; text: string }[];
}
type SlackMessage = {
  ts: string;
  thread_ts?: string;
  text: string;
  [key: string]: any;
  replies: SlackMessage[]
};


export class SlackReader {

  private app: InstanceType<typeof Bolt.App>;
  private readonly token: string;
  private readonly signingSecret: string;
  private readonly tenHoursAgo: number;

  constructor() {

    this.token = process.env.SLACK_USER_TOKEN!;
    this.signingSecret = process.env.SLACK_USER_SIGNING_SECRET!;
    this.tenHoursAgo = Math.floor(Date.now() / 1000) - 10 * 60 * 60;

    this.app = new Bolt.App({
      token: this.token,
      signingSecret: this.signingSecret,
      logLevel: Bolt.LogLevel.INFO,
    });

    console.log(`SlackReader initialized with token: ${this.token}, secret: ${this.signingSecret}`);
  }

  public async getMessages(): Promise<SlackMessageResult> {
    const results: Record<string, any> = {};
    const channelMap = this.getChannelMap() || await this.getJoinedChannelMap();
    console.log('Got joined channel names:', channelMap);

    for (const [channelId, channelName] of Object.entries(channelMap)) {
      const result = await this.fetchMessagesByChannel(channelId, channelName, "userId");
      results[`${channelName}(${channelId})`] = result;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        },
      ],
    };
  }

  private getChannelMap(): Record<string, string> | undefined {
    const rawMap = process.env.SLACK_CHANNELS;

    if (rawMap) {
      try {
        return JSON.parse(rawMap);
      } catch (err) {
        throw new Error('Invalid JSON in SLACK_CHANNELS: ' + err);
      }
    }
  }

  private async getJoinedChannelMap(): Promise<Record<string, string>> {
    try {
      const result = await this.app.client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: true,
      });

      const channels = result.channels ?? [];
      const map: Record<string, string> = {};

      for (const channel of channels) {
        if (channel.is_member && channel.id && channel.name) {
          map[channel.id] = channel.name;
        }
      }

      const outputPath = path.join('conversations', 'channels.json');
      console.log(outputPath);
      await fs.writeFile(outputPath, JSON.stringify(map, null, 2), 'utf-8');
      console.log(`✅ Saved joined channels map to ${outputPath}`);

      return map;
    } catch (err) {
      console.error('❌ Failed to fetch joined channels:', err);
      return {};
    }
  }


  private async fetchMessagesByChannel(channelId: string, channelName: string, userId: string): Promise<string> {
    try {
      const folder = "conversations/" + channelId+"-"+ channelName;
      const existingMessages = await this.loadMessagesByTs(folder);
      const messages: SlackMessage[] = await this.fetchChannelThreads(channelId, existingMessages);
      this.writeMessagesGroupedByDate(messages, folder);
      return JSON.stringify(messages);
    } catch (err) {
      console.error('Error fetching messages for channel', channelId, err);
    }
    return "";
  }
  async loadMessagesByTs(
    channelId: string
  ): Promise<Record<string, SlackMessage>> {
    const dir = path.join(channelId);
    const messages: Record<string, SlackMessage> = {};

    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const array: SlackMessage[] = JSON.parse(content);

          for (const msg of array) {
            if (msg.ts) {
              messages[msg.ts] = msg;
            }
          }
        } catch (err) {
          console.warn(`⚠️ Failed to parse ${file}:`, err);
        }
      }
      //console.warn(`⚠️ existing:`, JSON.stringify(messages));
      return messages;
    } catch (err) {
      console.warn(`⚠️ err:`, JSON.stringify(err));
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw err;
    }
  }

  private async fetchChannelThreads(channel: string, existingMessages: Record<string, SlackMessage>): Promise<SlackMessage[]> {
    // const result: SlackMessage[] = [];
    const newMessages = (await this.fetchAllMessages(channel)).sort((a, b) => Number(a.ts) - Number(b.ts));
    for (const msg of newMessages) {
      delete msg.blocks;
      delete msg.bot_profile;
    }
    console.log("allMessages for " + channel + ": " + newMessages.length);

    for (const msg of newMessages) {
      // 只处理主消息（不是别人回复的）
      if (msg.thread_ts) {
        const old = existingMessages[msg.ts];
        //console.log("old " +JSON.stringify(old));
        const needsUpdate = !old || old.reply_count !== msg.reply_count || old.latest_reply !== msg.latest_reply;

        if (needsUpdate) {
          console.log("Update " + msg.ts + "/" + msg.thread_ts);
          const replies = await this.fetchReplies(channel, msg.thread_ts);
          // 删除 replies 中的 blocks 字段
          msg.replies = replies.slice(1).map(reply => {
            const cleanReply = { ...reply };
            delete cleanReply.blocks;
            delete cleanReply.bot_profile;
            return cleanReply;
          });
        } else {
          msg.replies = old.replies;
        }
      }
    }
    console.log("fetchChannelThreads: " + JSON.stringify(newMessages));
    return newMessages;
  }
/**
 * 获取 N 天前的 UTC 零点时间戳（单位：秒）
 * 用于 Slack conversations.history 的 oldest 参数
 */
private getDaysAgo(days: number): number {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);       // 设置为今天的 UTC 00:00
  date.setUTCDate(date.getUTCDate() - days); // 回退 N 天
  return Math.floor(date.getTime() / 1000);   // 转换为秒级时间戳
}

  private async fetchAllMessages(channelId: string): Promise<SlackMessage[]> {
    const BATCH_SIZE = 200;
    const MAX_RECORDS = 1000;
    const OLDEST = this.getDaysAgo(100);
    let allMessages: SlackMessage[] = [];
    let cursor: string | undefined = undefined;

    do {
      const result: WebAPICallResult = await this.app.client.conversations.history({
        channel: channelId,
        cursor,
        oldest: OLDEST,
        limit: BATCH_SIZE,
      });

      if (result.messages) {
        allMessages.push(...(result.messages as SlackMessage[]));
      }

      cursor = result.response_metadata?.next_cursor;
    } while (cursor && allMessages.length < MAX_RECORDS);

    return allMessages;
  }



  private async fetchReplies(channel: string, threadTs: string): Promise<SlackMessage[]> {
    let allReplies: SlackMessage[] = [];
    let cursor: string | undefined = undefined;

    do {
      const result: WebAPICallResult = await this.app.client.conversations.replies({
        channel,
        ts: threadTs,
        cursor,
        limit: 200,
      });

      if (result.messages) {
        allReplies.push(...(result.messages as SlackMessage[]));
      }

      cursor = result.response_metadata?.next_cursor;
    } while (cursor);
    console.log("fetchReplies for " + channel + ", " + threadTs + ": " + allReplies.length);

    return allReplies;
  }
  private formatDate(ts: string): string {
    const date = new Date(Number(ts) * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`; // e.g. 20250708
  }

  private async writeMessagesGroupedByDate(messages: SlackMessage[], outputDir: string): Promise<void> {
    const grouped: Record<string, SlackMessage[]> = {};

    // 分组
    for (const msg of messages) {
      const dateKey = this.formatDate(msg.ts);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    }

    // 创建目录
    await fs.mkdir(outputDir, { recursive: true });

    // 写入文件
    for (const [date, msgs] of Object.entries(grouped)) {
      const filePath = path.join(outputDir, `${date}.json`);
      await fs.writeFile(filePath, JSON.stringify(msgs, null, 2), 'utf-8');
      console.log(`Wrote ${msgs.length} messages to ${filePath}`);
    }
  }

}
