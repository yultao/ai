
import * as fs from 'fs';
import * as path from 'path';


export type SlackMessage = {
  ts: string;
  thread_ts?: string;
  text: string;
  [key: string]: any;
  replies: SlackMessage[]
};


export async function loadMessagesByTs(
    channelId: string
  ): Promise<Record<string, SlackMessage>> {
    const dir = path.join(channelId);
    if (!fs.existsSync(dir)) {
      return {};
    }

    const messages: Record<string, SlackMessage> = {};

    try {

      const files = await fs.promises.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
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
