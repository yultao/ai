import * as fs from 'fs';
import * as path from 'path';

type SlackMessage = {
  [key: string]: any;
};

export default class SlackConversationParser {
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

        console.log(`Saved ${messages.length} messages to ${outputFilePath}`);
      }
    }
  }

  private parseMessagesFromFolder(folderPath: string): SlackMessage[] {
    let allMessages: SlackMessage[] = [];
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isFile() && file.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);

          const messages = this.extractMessages(parsed);
          const cleaned = messages.map((msg: SlackMessage) => {
            const { blocks, ...rest } = msg;
            return rest;
          });

          allMessages.push(...cleaned);
        } catch (err) {
          console.warn(`Failed to parse ${filePath}: ${err}`);
        }
      }
    }

    return allMessages;
  }

  private extractMessages(json: any): SlackMessage[] {
    if (Array.isArray(json.messages)) {
      return json.messages;
    }

    if (json.history && Array.isArray(json.history.messages)) {
      return json.history.messages;
    }

    return []; // fallback if neither exists
  }
}
