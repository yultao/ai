import MCPClient from './McpClient.js';
import MyAgent from './MyAgent.js';
import {logInfo,logTitle} from "./Logger.js";


async function main() {
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

    const prompt = "Show me the files in the current directory.";
    logInfo(`Invoking agent with prompt: ${prompt}`);
    try {
        const response = await myAgent.invoke(prompt);
        logInfo(`Response: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
        logInfo(`Error invoking agent: ${error}`);
    } finally {
        await myAgent.close();
    }   
}
main();