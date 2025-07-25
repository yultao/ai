
import Config from './util/config.js';
import Agent from './agent/agent.js';
import KnowledgeContext from './rag/knowledge-context.js';
import { logInfo, logError } from "./util/logger.js";
import { createInterface } from "readline/promises";
import dotenv from 'dotenv';

export default class TaoBot {
    private configPath: string;
    constructor(aiConfigPath: string = "config.json") {
        this.configPath = aiConfigPath;
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

        const aiConfig = new Config(this.configPath);4
        const preferecneConfig = aiConfig.getPreferecneConfig();
        logInfo(`Using preferecnes: ${JSON.stringify(preferecneConfig)}`);

        const servers = aiConfig.getMcpServerConfigs();
        const mcpServers = servers.filter(server => !server.disabled);
        logInfo(`Using MCP servers: ${JSON.stringify(mcpServers.map(s => s.name))}`);
        // const mcpClients = activeServers.map(server => new MCPClient(`${server.name}-client`, server.command, server.args));


        dotenv.config();
        const { name: providerName, config: apiProviderConfig } = aiConfig.getEnabledApiProvider();
        // const apiProviderConfig = aiConfig.getApiProviderConfig();

        const apiKey = process.env[apiProviderConfig.apiKey] || "";
        const apiBaseURL = apiProviderConfig.apiBaseURL;
        logInfo(`Using Provider API Key: ${apiKey.slice(0, 5) + '*'.repeat(Math.min(10, apiKey.length - 5))}`);
        logInfo(`Using Provider API Base URL: ${apiBaseURL}`);
        const { name: modelName, config: modelConfig } = aiConfig.getEnabledModel();
        logInfo(`Using LLM model: ${modelName}`);


        const systemPrompt = "You are an AI assitant";
        logInfo(`Using system prompt: ${systemPrompt}`);

        const embeddingConfig = aiConfig.getEmbeddingConfig();
        logInfo(`Using embedding model: ${embeddingConfig.model}`);


        logInfo(`Using knowledge folder: ${knowledgeDir}`);
        // const knowledgeContext = new KnowledgeContext(embeddingConfig.model, knowledgeDir);
        // await knowledgeContext.init();
        // const context = await knowledgeContext.retrieveContext(prompt);
        const context = "";

        const myAgent = new Agent(mcpServers, preferecneConfig.llmClientType, apiKey, apiBaseURL, modelName, systemPrompt, context);


        await myAgent.init();
        return myAgent;
    }

    /*
    scenario 1: single question, based on a specific knowledge context
    */
    public async invokeQuery(prompt: string, knowledgeDir?: string) {
        const myAgent = await this.createAgent(knowledgeDir, prompt);
        let response
        try {
            response = await myAgent.invoke(prompt);
            // logInfo(`Response: ${JSON.stringify(response, null, 2)}`);
        } catch (error) {
            logError(`Error query: ${error}`);
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
    private agents: Record<string, Agent> = {};
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
    public async invokeChat(knowledgeDir?: string) {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const myAgent = await this.createAgent(knowledgeDir);
        try {

            while (true) {
                const prompt = await rl.question("> ");
                if (
                    prompt.trim().toLowerCase() === "bye"
                    || prompt.trim().toLowerCase() === "exit"
                    || prompt.trim().toLowerCase() === "quit"
                    || prompt.trim().toLowerCase() === ":q"
                    || prompt.trim().toLowerCase() === ":x"
                ) {
                    break;
                }
                await myAgent.invoke(prompt);
            }
        } catch (error) {
            logError(`Error invokeChat: ${error}`);
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
                const prompt = await rl.question(">> ");
                if (
                    prompt.trim().toLowerCase() === "bye"
                    || prompt.trim().toLowerCase() === "exit"
                    || prompt.trim().toLowerCase() === "quit"
                    || prompt.trim().toLowerCase() === ":q"
                    || prompt.trim().toLowerCase() === ":x"
                ) {
                    break;
                }
                const chatStream = myAgent.stream(prompt);
                for await (const chunk of chatStream) {
                    yield chunk;
                }
            }
        } catch (error) {
            logError(`Error streamChat: ${error}`);
        } finally {
            await myAgent.close();
            rl.close();
        }
    }

}