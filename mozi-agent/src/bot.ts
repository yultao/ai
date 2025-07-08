
// import MCPClient from './mcp-client.js';
import MyAgent from './ai-agent.js';
import { logInfo, logTitle, logError } from "./logger.js";
import AiConfig from './config.js';
import { createInterface } from "readline/promises";
import KnowledgeContext from './knowledge-context.js';
import dotenv from 'dotenv';
export default class Bot {
    private aiConfigPath: string;


    constructor(aiConfigPath: string = "aiconfig.json") {
        this.aiConfigPath = aiConfigPath;

    }

    private async createAgent(knowledgeDir: string = "knowledge", prompt?:string) {
        logInfo("Starting my-agent...");
        // Parse command line arguments
        const args = process.argv.slice(2);
        logInfo(`Using args: ${JSON.stringify(args)}`);

        const aiConfig = AiConfig.getInstance(this.aiConfigPath);
        const servers = aiConfig.getMcpServerConfigs();
        const mcpServers = servers.filter(server => !server.disabled);
        logInfo(`Using MCP servers: ${JSON.stringify(mcpServers)}`);
        // const mcpClients = activeServers.map(server => new MCPClient(`${server.name}-client`, server.command, server.args));


        dotenv.config();
        const apiProviderConfig = aiConfig.getApiProviderConfig();

        const apiKey = process.env.OPENAI_API_KEY || apiProviderConfig.apiKey;
        const apiBaseURL = apiProviderConfig.apiBaseURL;;
        logInfo(`Using Provider API Key: ${apiKey}`);
        logInfo(`Using Provider API Base URL: ${apiBaseURL}`);

        const model = args[0] || aiConfig.getModelConfig();
        logInfo(`Using model: ${model}`);





        const systemPrompt = "You are an AI assitant";
        logInfo(`Using system prompt: ${systemPrompt}`);

        const embeddingConfig = aiConfig.getEmbeddingConfig();
        logInfo(`Using Embedding model: ${embeddingConfig.model}`);


        logInfo(`Using Knowledge DIR: ${knowledgeDir}`);
        const knowledgeContext = new KnowledgeContext(embeddingConfig.model, knowledgeDir);
        const context = await knowledgeContext.retrieveContext(prompt); 


        const myAgent = new MyAgent(mcpServers, apiKey, apiBaseURL, model, systemPrompt, context);


        await myAgent.init();
        return myAgent;
    }
    

    /*
    scenario 1: single question, based on a specific knowledge context
    */
    public async askSingleQuestion(prompt: string, knowledgeDir?:string) {
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

    


    /**
     * scnario 2: chat from time to time, based on a full knowledage base
     */
    private longAgent?: MyAgent = undefined;
    public async startConversation(knowledgeDir?: string) {
        this.longAgent = await this.createAgent(knowledgeDir);
    }
    public async continueConversation(question: string) {
        let response
        try {
            response = await this.longAgent!.invoke(question);
            // logInfo(`Response: ${JSON.stringify(response, null, 2)}`);
        } catch (error) {
            logError(`Error invoking agent: ${error}`);
        }
        return response;
    }
    public async stopConversation() {
        await this.longAgent!.close();
    }

    /**
     * scenario 3: self-loop conversation, based on a full knowledge context
     */
    public async loopChat(knowledgeDir?:string) {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const myAgent = await this.createAgent(knowledgeDir);
        try {

            while (true) {
                const prompt = await rl.question("mozi> ");
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
}