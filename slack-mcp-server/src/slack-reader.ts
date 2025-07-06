import Bolt from '@slack/bolt';
import dotenv from 'dotenv';
dotenv.config();

interface SlackMessageResult {
  content: { type: string; text: string }[];
}

export class SlackReader {
  
  private app: InstanceType<typeof Bolt.App>;
  private readonly token: string;
  private readonly signingSecret: string;
  private readonly userChannelId?: string;
  private readonly tenHoursAgo: number;

  constructor() {
    this.token = process.env.SLACK_USER_TOKEN!;
    this.signingSecret = process.env.SLACK_USER_SIGNING_SECRET!;
    this.userChannelId = process.env.SLACK_USER_CHANNEL_ID;
    this.tenHoursAgo = Math.floor(Date.now() / 1000) - 10 * 60 * 60;

    this.app = new Bolt.App({
      token: this.token,
      signingSecret: this.signingSecret,
      logLevel: Bolt.LogLevel.INFO,
    });

    console.log(`SlackReader initialized with token: ${this.token}, secret: ${this.signingSecret}`);
  }

  async getRecentMessages(): Promise<void> {
    try {
      if (!this.userChannelId) {
        throw new Error('SLACK_USER_CHANNEL_ID is not defined in environment variables.');
      }

      const result = await this.app.client.conversations.history({
        channel: this.userChannelId,
        oldest: this.tenHoursAgo.toString(),
        limit: 100,
      });

      console.log(`Messages from the past 10 hours:`);
      result.messages?.forEach((msg, index) => {
        console.log(`[${new Date(+msg.ts! * 1000).toLocaleString()}]: ${index + 1}. ${msg.text}`);
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }

  async getJoinedChannelMap(): Promise<Record<string, string>> {
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

      return map;
    } catch (err) {
      console.error('Failed to fetch joined channels:', err);
      return {};
    }
  }

  async fetchMessages(channelId: string, userId: string): Promise<void> {
    try {
      const result = await this.app.client.conversations.history({
        channel: channelId,
        oldest: this.tenHoursAgo.toString(),
        limit: 100,
      });

      const messages = result.messages ?? [];

      const sentByUser = messages.filter(m => m.user === userId);
      const mentionsUser = messages.filter(m => m.text?.includes(`<@${userId}>`));

      console.log(`Messages from channel ${channelId}:`);
      messages.forEach(m =>
        console.log(`[${new Date(+m.ts! * 1000).toLocaleString()}] ${m.text}`)
      );

      console.log('Sent by user:', sentByUser.map(m => m.text));
      console.log('Mentioning user:', mentionsUser.map(m => m.text));
    } catch (err) {
      console.error('Error fetching messages for channel', channelId, err);
    }
  }

  async getMessages(): Promise<SlackMessageResult> {
    const results: Record<string, any> = {};
    const channelMap = await this.getJoinedChannelMap();
    console.log('Joined channel names:', channelMap);

    const users = await this.app.client.users.list({});
    const george = users.members?.find(u => u.real_name === 'G T');

    if (!george?.id) {
      throw new Error('User G T not found');
    }

    const userId = george.id;
    console.log(`G T's user ID: ${userId}`);

    for (const [channelId, channelName] of Object.entries(channelMap)) {
      await this.fetchMessages(channelId, userId);
      results[`${channelName}(${channelId})`] = `Fetched messages for ${channelName}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Slack conversations:\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }
}
