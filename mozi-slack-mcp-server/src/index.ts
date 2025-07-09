import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Slack from '@slack/bolt';
import { SlackReader } from "./slack-reader.js"
//https://www.youtube.com/watch?v=SbUv1nCS7a0&t=476s



const token2: string = process.env.SLACK_USER_TOKEN as string;
const signingSecret2: string = process.env.SLACK_USER_SIGNING_SECRET as string
console.log("Slack user token:", token2);
console.log("Slack user signing secret:", signingSecret2);

const app = new Slack.App({
  token: token2,
  signingSecret: signingSecret2
});

console.log("Slack read app initialized with signing secret and bot token");

console.log('Channel ID:', process.env.SLACK_USER_CHANNEL_ID);
// 10 hours ago in Unix timestamp
const now = Math.floor(Date.now() / 1000);
const sometimeAgo: string = (now - 2400 * 60 * 60).toString();



async function fetchSlackMessages(token: string,
  channelId: string,
  limit: number = 100
): Promise<string[]> {
  try {
    const result = await app.client.conversations.history({
      channel: channelId,
      limit: limit,
      oldest: sometimeAgo,
    });

    const messagesText: string[] = [];

    if (result.messages) {
      for (const msg of result.messages) {
        const message = msg as { text?: string; ts?: string };
        messagesText.push(message.text ?? '[no text]');
      }
    }

    return messagesText;
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    return [];
  }
}

// Create an MCP server
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
});

// Add an addition tool
server.registerTool("add",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => {

    console.error(`add tool called with a=${a}, b=${b}`);
    return ({
      content: [{ type: "text", text: String(a + b) }]
    });
  }
);



server.registerTool("read-slack-conversations",
  {
    title: "Slack Reader",
    description: "Read Slack Converstaions History"
  },
  async (_input, context) => {
   
      const slackReader = new SlackReader();
      const results = await slackReader.getMessages();
      return ({
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
    });
  }
);

// server.registerTool("read-slack-conversations",
//   {
//     title: "Slack Reader",
//     description: "Read Slack Converstaions History"
//   },
//   async (_input, context) => {
   
//     const results: Record<string, string[]> = {};
//     const channelMap = await getJoinedChannelMap();
//     console.log('Joined channel names:', channelMap);

//     for (const [channelId, channelName] of Object.entries(channelMap)) {
//       const messages = await fetchSlackMessages("slackToken", channelId, 100);
//       console.log('Messages list:', messages);

//       const key = `${channelName}(${channelId})`;
//       results[key] = messages;
//     }
//     // return {
//     //       content: [
//     //         {
//     //           type: "json",
//     //           json: results,
//     //         },
//     //       ],
//     //     };

//     return ({
//       content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
//     });
//   }
// );


// async function getJoinedChannelMap(): Promise<Record<string, string>> {
//   try {
//     const result = await app.client.conversations.list({
//       types: 'public_channel,private_channel',
//       exclude_archived: true,
//     });

//     const channels = result.channels ?? [];

//     const joinedChannelMap: Record<string, string> = {};

//     for (const channel of channels) {
//       if (channel.is_member && channel.id && channel.name) {
//         joinedChannelMap[channel.id] = channel.name;
//       }
//     }

//     return joinedChannelMap;
//   } catch (error) {
//     console.error('Failed to fetch joined channels:', error);
//     return {};
//   }
// }

 async function getChannelName(channelId: string): Promise<string | null> {
  try {
    const result = await app.client.conversations.info({
      channel: channelId,
    });

    if (result.ok && result.channel && "name" in result.channel) {
      return result.channel.name!;
    }
    return null;
  } catch (err) {
    console.error("Failed to get channel name:", err);
    return null;
  }
}

server.registerResource(
  "get-channel-name",
  new ResourceTemplate("slack://channel/{id}", { list: undefined }),
  {
    title: "Slack Channel Name",
    description: "Fetch Slack channel name from ID using Bolt client"
  },
  async (uri, { id }) => {
    const name = await getChannelName(id as string);
    return {
      contents: [{
        uri: uri.href,
        text: name ? `Channel name: ${name}` : "Channel not found",
      }],
    };
  }
);

server.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  {
    title: "Greeting Resource",      // Display name for UI
    description: "Dynamic greeting generator"
  },
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Server connected to stdio.");
