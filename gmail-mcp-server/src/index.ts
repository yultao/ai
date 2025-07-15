import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { GmailService } from './gmail.js';
//https://www.youtube.com/watch?v=SbUv1nCS7a0&t=476s



const token2: string = process.env.SLACK_USER_TOKEN as string;
const signingSecret2: string = process.env.SLACK_USER_SIGNING_SECRET as string
console.log("Slack user token:", token2);
console.log("Slack user signing secret:", signingSecret2);


console.log("Slack read app initialized with signing secret and bot token");

console.log('Channel ID:', process.env.SLACK_USER_CHANNEL_ID);
// 10 hours ago in Unix timestamp
const now = Math.floor(Date.now() / 1000);
const sometimeAgo: string = (now - 2400 * 60 * 60).toString();




// Create an MCP server
const server = new McpServer({
  name: "gmail-mcp-server",
  version: "1.0.0"
});


server.registerTool("send-email",
  {
    title: "Email Sender",
    description: "Send an email to a recipient with subject and body",
    inputSchema: { recipient: z.string(), subject: z.string(), body: z.string() }
  },
  async ({ recipient, subject, body }, context) => {
    const gmail = new GmailService();
    gmail.sendEmail( recipient,subject,body).catch(console.error);
    return ({
      content: [{ type: "text", text: "email "+subject+" sent to " + recipient}]
    });
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
