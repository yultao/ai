import MCPClient from './McpClient.js';
import MyAgent from './MyAgent.js';
import logInfo from './Logger.js';
import { getMcpServerConfigs } from './McpServerConfig.js';
import { createInterface } from "readline/promises";

async function main() {
    logInfo("Starting my-agent...");

    // Example usage
    const servers = getMcpServerConfigs("C:\\Workspace\\ai\\my-openai-agent");
    console.log(servers);
    const activeServers = servers.filter(server => !server.disabled);
    console.log(activeServers);


    // Dynamically create MCPClient instances from servers
    const mcpClients = activeServers
        .map(server => {
            const clientName = `${server.name}-client`;
            return new MCPClient(clientName, server.command, server.args);
        });

    const myAgent = new MyAgent(mcpClients, 'default', 'deepseek/deepseek-chat:free', "You are a helpful assistant.");
    await myAgent.init();
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    try {
        while (true) {
            const prompt = await rl.question("Enter your prompt (enter 'exit' to exit): ");
            if (prompt.trim().toLowerCase() === "exit") {
                logInfo("Exiting...");
                break;
            }
            logInfo(`Invoking agent with prompt: ${prompt}`);
            const content = await myAgent.invoke(prompt);
            logInfo(`Response: ${JSON.stringify(content, null, 2)}`);
        }
    } catch (error) {
        logInfo(`Error invoking agent: ${error}`);
    } finally {
        await myAgent.close();
        rl.close();
        logInfo("Exited.");
    }
}
main();