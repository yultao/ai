import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Slack from '@slack/bolt';
//https://www.youtube.com/watch?v=SbUv1nCS7a0&t=476s
const token = "xoxp-9121446094692-9121446119588-9126918171239-e027b8873aad5f91303bf2878c2bbadc"; // process.env.SLACK_USER_TOKEN;
const signingSecret = "c2c5eec8d39db9f1823596e20aaa1ccd"; // 
const app = new Slack.App({
    token,
    signingSecret
});
console.log("Slack read app initialized with signing secret and bot token");
console.log('Channel ID:', process.env.SLACK_USER_CHANNEL_ID);
// 10 hours ago in Unix timestamp
const now = Math.floor(Date.now() / 1000);
const channelId = "C093GASKAKF"; //"C093KD45H3N"
async function fetchSlackMessages(token, channelId, limit = 100) {
    try {
        const result = await app.client.conversations.history({
            channel: channelId,
            limit: limit,
        });
        const messagesText = [];
        if (result.messages) {
            for (const msg of result.messages) {
                const message = msg;
                messagesText.push(message.text ?? '[no text]');
            }
        }
        return messagesText;
    }
    catch (err) {
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
server.registerTool("add", {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() }
}, async ({ a, b }) => {
    console.error(`add tool called with a=${a}, b=${b}`);
    return ({
        content: [{ type: "text", text: String(a + b) }]
    });
});
server.registerTool("readme", {
    title: "Slack Reader",
    description: "Read Slack Converstaions History"
}, async (_input, context) => {
    //  const messages = await getRecentMessages();
    const results = {};
    const channelIds = ["C093GASKAKF", "C093KD45H3N"]; // You can add more channel IDs if needed
    for (const channelId of channelIds) {
        const messages = await fetchSlackMessages("slackToken", channelId);
        console.log('Messages list:', messages);
        results[channelId] = messages;
    }
    // return {
    //       content: [
    //         {
    //           type: "json",
    //           json: results,
    //         },
    //       ],
    //     };
    return ({
        content: [{ type: "text", text: "Reading Slack conversations..." + JSON.stringify(results, null, 2) }]
    });
});
async function getChannelName(channelId) {
    try {
        const result = await app.client.conversations.info({
            channel: channelId,
        });
        if (result.ok && result.channel && "name" in result.channel) {
            return result.channel.name;
        }
        return null;
    }
    catch (err) {
        console.error("Failed to get channel name:", err);
        return null;
    }
}
server.registerResource("get-channel-name", new ResourceTemplate("slack://channel/{id}", { list: undefined }), {
    title: "Slack Channel Name",
    description: "Fetch Slack channel name from ID using Bolt client"
}, async (uri, { id }) => {
    const name = await getChannelName(id);
    return {
        contents: [{
                uri: uri.href,
                text: name ? `Channel name: ${name}` : "Channel not found",
            }],
    };
});
server.registerResource("greeting", new ResourceTemplate("greeting://{name}", { list: undefined }), {
    title: "Greeting Resource", // Display name for UI
    description: "Dynamic greeting generator"
}, async (uri, { name }) => ({
    contents: [{
            uri: uri.href,
            text: `Hello, ${name}!`
        }]
}));
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
