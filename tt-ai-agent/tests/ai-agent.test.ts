import MCPClient from '../src/mcp-client.js';
import MyAgent from '../src/ai-agent.js';
import {logInfo,logTitle} from "../src/logger.js";


async function testAll() {
    logInfo("Starting my-agent...");

    // Initialize MCP clients
    const mcpClients = [
        // new MCPClient('slack-mcp-client', `node`, ['C:/Workspace/ai/slack-mcp-server/build/index.js']),
        new MCPClient('file-client', `npx`, ['-y',
            "@modelcontextprotocol/server-filesystem",
            "C:\\Workspace\\ai\\my-agent\\dist"
        ]),

    ];
    const myAgent = new MyAgent(mcpClients, 'default', 'deepseek/deepseek-chat:free', "You are a helpful assistant.");
    await myAgent.init();
    let response;
    const prompt = "Show me the files in the current directory.";
    logInfo(`Invoking agent with prompt: ${prompt}`);
    try {
        response = await myAgent.invoke(prompt);
        logInfo(`Response: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
        logInfo(`Error invoking agent: ${error}`);
    } finally {
        await myAgent.close();
    }
    return response; 
}

test('test agent', () => {
  expect(testAll()).toBe(3);
});