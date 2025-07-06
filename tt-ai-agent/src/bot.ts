
import MCPClient from './mcp-client.js';
import MyAgent from './ai-agent.js';
import { logInfo, logTitle, logError } from "./logger.js";
import AiConfig  from './ai-config.js';
import { createInterface } from "readline/promises";

import dotenv from 'dotenv';
export default class QnA {
    private aiConfigPath: string;
    constructor(aiConfigPath: string = "aiconfig.json") {
        this.aiConfigPath = aiConfigPath;
    }

    private async getAgent() {
        logInfo("Starting my-agent...");
        // Parse command line arguments
        const args = process.argv.slice(2);
        logInfo(`Using args: ${JSON.stringify(args)}`);

        const aiConfig = AiConfig.getInstance(this.aiConfigPath);
        const servers = aiConfig.getMcpServerConfigs();
        const activeServers = servers.filter(server => !server.disabled);
        logInfo(`Using servers: ${JSON.stringify(activeServers)}`);


        dotenv.config();
        const apiProviderConfig = aiConfig.getApiProviderConfig();

        const apiKey = process.env.OPENAI_API_KEY || apiProviderConfig.apiKey;
        const apiBaseURL = apiProviderConfig.apiBaseURL;;
        logInfo(`Using API Key: ${apiKey}`);
        logInfo(`Using API Base URL: ${apiBaseURL}`);

        const model = args[0] || aiConfig.getModelConfig();
        logInfo(`Using model: ${model}`);


        const mcpClients = activeServers
            .map(server => {
                const clientName = `${server.name}-client`;
                return new MCPClient(clientName, server.command, server.args);
            });

        const myAgent = new MyAgent(mcpClients, apiKey, apiBaseURL, model);


        await myAgent.init();
        return myAgent;
    }
    
    public async chat() {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const myAgent = await this.getAgent();
        try {
            
            while (true) {
                const prompt = await rl.question("Enter your prompt (or exit): ");
                if (prompt.trim().toLowerCase() === "exit") {
                    break;
                }
                const content = await myAgent.invoke(prompt);
            }
        } catch (error) {
            logError(`Error invoking agent: ${error}`);
        } finally {
            await myAgent.close();
            rl.close();
        }
    }

    public async ask(question: string) {
        const myAgent = await this.getAgent();
        let response
        try {
            response = await myAgent.invoke(question);
            logInfo(`Response: ${JSON.stringify(response, null, 2)}`);
        } catch (error) {
            logError(`Error invoking agent: ${error}`);
        } finally {
            await myAgent.close();
        }
        return response;
    }
}