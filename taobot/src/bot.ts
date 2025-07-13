
// import MCPClient from './mcp-client.js';
import MyAgent from './agent.js';
import { logInfo, logError } from "./logger.js";
import AiConfig from './config.js';
import { createInterface } from "readline/promises";
import KnowledgeContext from './knowledge-context.js';
import dotenv from 'dotenv';
export default class Bot {
    private aiConfigPath: string;


    constructor(aiConfigPath: string = "ttconfig.json") {
        this.aiConfigPath = aiConfigPath;

    }

    /**
     * Create an agent
     * @param knowledgeDir - always try to retrieve context from knowledgeDir 
     * @param prompt - if present, retrieve sepecific context according to prompt, otherwise full context
     * @returns 
     */
    private async createAgent(knowledgeDir: string = "knowledge", prompt?: string) {
        logInfo("Starting my-agent...");
        // Parse command line arguments
        const args = process.argv.slice(2);
        logInfo(`Using args: ${JSON.stringify(args)}`);

        const aiConfig = AiConfig.getInstance(this.aiConfigPath);
        const servers = aiConfig.getMcpServerConfigs();
        const mcpServers = servers.filter(server => !server.disabled);
        logInfo(`Using MCP servers: ${JSON.stringify(mcpServers.map(s => s.name))}`);
        // const mcpClients = activeServers.map(server => new MCPClient(`${server.name}-client`, server.command, server.args));


        dotenv.config();
        const { name: providerName, config: apiProviderConfig } = aiConfig.getEnabledApiProvider();
        // const apiProviderConfig = aiConfig.getApiProviderConfig();

        const apiKey = process.env.OPENAI_API_KEY || apiProviderConfig.apiKey;
        const apiBaseURL = apiProviderConfig.apiBaseURL;
        logInfo(`Using Provider API Key: ${apiKey.slice(0, 5) + '*'.repeat(apiKey.length - 5)}`);
        logInfo(`Using Provider API Base URL: ${apiBaseURL}`);
        const { name: modelName, config: modelConfig } = aiConfig.getEnabledModel();
        const model = args[0] || modelName;
        logInfo(`Using LLM model: ${model}`);





        const systemPrompt = "You are an AI assitant";
        logInfo(`Using system prompt: ${systemPrompt}`);

        const embeddingConfig = aiConfig.getEmbeddingConfig();
        logInfo(`Using embedding model: ${embeddingConfig.model}`);


        logInfo(`Using knowledge folder: ${knowledgeDir}`);
        const knowledgeContext = new KnowledgeContext(embeddingConfig.model, knowledgeDir);
        const context = await knowledgeContext.retrieveContext(prompt);


        const myAgent = new MyAgent(mcpServers, apiKey, apiBaseURL, model, systemPrompt, context);


        await myAgent.init();
        return myAgent;
    }


    /*
    scenario 1: single question, based on a specific knowledge context
    */
    public async query(prompt: string, knowledgeDir?: string) {
        const myAgent = await this.createAgent(knowledgeDir, prompt);
        let response
        try {
            response = await myAgent.invoke(prompt);
            // logInfo(`Response: ${JSON.stringify(response, null, 2)}`);
        } catch (error) {
            logError(`Error invoking agent: ${error}`);
        } finally {
            await myAgent.close();
        }
        return response;
    }


    public async *streamQuery(prompt: string, knowledgeDir?: string): AsyncGenerator<string, void, unknown> {
        const myAgent = await this.createAgent(knowledgeDir, prompt);
        try {
            const chatStream = myAgent.stream(prompt);
            for await (const chunk of chatStream) {
                yield chunk;
            }
        } catch (error) {
            logError(`Error stream: ${error}`);
        } finally {
            await myAgent.close();
        }
    }



    /**
     * scnario 2: chat from time to time, based on a full knowledage base
     */
    private agents: Record<string, MyAgent> = {};
    public async startConversation(agentId: string, knowledgeDir?: string) {
        this.agents[agentId] = await this.createAgent(knowledgeDir);
    }
    public async continueConversation(agentId: string, question: string) {
        const agent = this.agents[agentId];
        let response
        try {
            response = await agent.invoke(question);
            // logInfo(`Response: ${JSON.stringify(response, null, 2)}`);
        } catch (error) {
            logError(`Error startConversation: ${error}`);
        }
        return response;
    }
    
    public async *streamContinueConversation(agentId: string, prompt: string): AsyncGenerator<string, void, unknown> {
        const myAgent = this.agents[agentId];
        let response
        try {
            const chatStream = myAgent.stream(prompt);
            for await (const chunk of chatStream) {
                yield chunk;
            }
        } catch (error) {
            logError(`Error streamContinueConversation: ${error}`);
        }
        return response;
    }

    public async stopConversation(agentId: string) {
        await this.agents[agentId].close();
    }

    /**
     * scenario 3: self-loop conversation, based on a full knowledge context
     */
    public async chat(knowledgeDir?: string) {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const myAgent = await this.createAgent(knowledgeDir);
        try {

            while (true) {
                const prompt = await rl.question("taobot> ");
                if (prompt.trim().toLowerCase() === "exit") {
                    break;
                }
                await myAgent.invoke(prompt);
            }
        } catch (error) {
            logError(`Error invoking agent: ${error}`);
        } finally {
            await myAgent.close();
            rl.close();
        }
    }



    public async *streamChat(knowledgeDir?: string): AsyncGenerator<string, void, unknown> {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const myAgent = await this.createAgent(knowledgeDir);
        try {

            while (true) {
                const prompt = await rl.question("taobot> ");
                if (prompt.trim().toLowerCase() === "exit") {
                    break;
                }
                const chatStream = myAgent.stream(prompt);
                for await (const chunk of chatStream) {
                    yield chunk;
                }
            }
        } catch (error) {
            logError(`Error invoking agent: ${error}`);
        } finally {
            await myAgent.close();
            rl.close();
        }
    }

}