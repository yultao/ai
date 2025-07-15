import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google, gmail_v1 } from 'googleapis';
import readline from 'readline';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GmailService {
  private credentialsPath: string;
  private tokenPath: string;
  private oAuth2Client: any;

  constructor(
    credentialsPath: string ='C:/Workspace/ai/gmail-mcp-server/credentials.json',
    tokenPath: string = 'C:/Workspace/ai/gmail-mcp-server/token.json'
  ) {
    this.credentialsPath = credentialsPath;
    this.tokenPath = tokenPath;
  }

  private async loadCredentials(): Promise<void> {
    const content = fs.readFileSync(this.credentialsPath, 'utf8');
    const { client_secret, client_id, redirect_uris } = JSON.parse(content).installed;
    this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  }

  private async authorize(): Promise<void> {
    if (fs.existsSync(this.tokenPath)) {
      const token = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
      this.oAuth2Client.setCredentials(token);
    } else {
      const authUrl = this.oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.send'],
      });

      console.log('Authorize this app by visiting this URL:', authUrl);
      await open(authUrl);

      const code = await this.promptForCode();
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(this.tokenPath, JSON.stringify(tokens));
      console.log('Token stored to', this.tokenPath);
    }
  }

  private promptForCode(): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        resolve(code);
      });
    });
  }

  private makeEmail(to: string, from: string, subject: string, body: string): string {
    const message = [
      `To: ${to}`,
      `From: ${from}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  public async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.loadCredentials();
    await this.authorize();

    const gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });

    const raw = this.makeEmail(to, 'yultaobot', subject, body);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    console.log('Email sent!');
  }
}
