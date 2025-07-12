import * as fs from 'fs';
import * as path from 'path';
import {SlackMessage} from './slack-common.js';


export class SlackConversationParser {
  private rootPath: string;
  private outputPath: string;

  constructor(channelRoot: string, outputDir: string) {
    this.rootPath = path.resolve(channelRoot);
    this.outputPath = path.resolve(outputDir);

    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  public processAllChannels(): void {
    const channelDirs = fs.readdirSync(this.rootPath);

    for (const dirName of channelDirs) {
      const fullDirPath = path.join(this.rootPath, dirName);
      if (fs.statSync(fullDirPath).isDirectory()) {
        const messages = this.parseMessagesFromFolder(fullDirPath);

        const outputFilePath = path.join(this.outputPath, `${dirName}.json`);
        fs.writeFileSync(outputFilePath, JSON.stringify(messages, null, 2), 'utf-8');

        console.log(`✅ Saved ${messages.length} messages to ${outputFilePath}`);
      }
    }
  }

  private parseMessagesFromFolder(folderPath: string): SlackMessage[] {
    const clientMsgMap: Map<string, SlackMessage> = new Map();
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isFile() && file.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);

          const messages = this.extractMessages(parsed);

          for (const msg of messages) {
            const { blocks, ...cleaned } = msg;
            const id = msg.client_msg_id || `${msg.ts}-${Math.random()}`;

            // Skip if already added (by client_msg_id)
            if (!clientMsgMap.has(id)) {
              clientMsgMap.set(id, cleaned);
            }
          }
        } catch (err) {
          console.warn(`⚠️ Failed to parse ${filePath}: ${err}`);
        }
      }
    }

    // Sort by timestamp
    return Array.from(clientMsgMap.values()).sort((a, b) =>
      parseFloat(a.ts) - parseFloat(b.ts)
    );
  }

  private extractMessages(json: any): SlackMessage[] {
    if (Array.isArray(json.messages)) {
      return json.messages;
    }
    if (json.history && Array.isArray(json.history.messages)) {
      return json.history.messages;
    }
    return [];
  }
}
