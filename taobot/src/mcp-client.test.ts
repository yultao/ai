
import MCPClient from './mcp-client.js';

async function main() {
    console.log("Starting my-agent...");
console.log(process.env.SLACK_USER_TOKEN);
console.log(process.env.SLACK_USER_SIGNING_SECRET);

    const mcpClient = new MCPClient('slack-mcp-client', `node`, ['C:/Workspace/ai/slack-mcp-server/build/index.js']);
    await mcpClient.init();
    const tools = mcpClient.getTools();
    console.log(tools);
    console.log("Available tools:", tools.map(tool => tool.name));
    mcpClient.close();
}
test('ask and answer', () => {
    expect(main()).toBe(3);
});