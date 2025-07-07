import MCPClient from './mcp-client.js';
import MyAgent from './ai-agent.js';
import AiConfig from './config.js';
import { logInfo, logTitle } from "./logger.js";
import EmbeddingRetrievers from "./embedding-retrievers.js";
import * as fs from "fs";
import * as path from "path";
import dotenv from 'dotenv';


//1. 生成
async function testAgent() {
    logInfo("Starting my-agent...");
    // const prompt = "列出当前目录下文件树形结构，并保存到一个文件dir.txt";
    const prompt = "请抓取https://jsonplaceholder.typicode.com/users的内容，并在knowledge目录中为每个人创建一个md文件，保存基本信息，文件名以人名字命名，空格以-替代。";
    // const prompt = "根据Bret的基本信息，写一个关于他的BIO，并保存到bio目录，以人名字命名的md文件。";

    // Initialize MCP clients
    const mcpClients = [
        new MCPClient('fetch-client', `uvx`, ['mcp-server-fetch']),
        new MCPClient('file-client', `npx`, ['-y', "@modelcontextprotocol/server-filesystem", "C:\\Workspace\\ai\\tt-ai-agent"]),
    ];
    dotenv.config();
    const aiConfig = AiConfig.getInstance();
    const apiProviderConfig = aiConfig.getApiProviderConfig();

    const providerApiKey = process.env.OPENAI_API_KEY || apiProviderConfig.apiKey;
    const providerApiBaseURL = apiProviderConfig.apiBaseURL;;
    logInfo(`Using API Key: ${providerApiKey}`);
    logInfo(`Using API Base URL: ${providerApiBaseURL}`);

    const model = aiConfig.getModelConfig();
    logInfo(`Using model: ${model}`);

    const systemPrompt = "You are a helpful assistant.";
    logInfo(`Using system prompt: ${systemPrompt}`);

    const embeddingConfig = aiConfig.getEmbeddingConfig();
    const embeddingApiKey = process.env.EMBEDDING_API_KEY || embeddingConfig.apiKey;
    const embeddingApiBaseURL = embeddingConfig.apiBaseURL;;
    logInfo(`Using Embedding API Key: ${embeddingApiKey}`);
    logInfo(`Using Embedding API Base URL: ${embeddingApiBaseURL}`);
    const context = await retrieveContext(embeddingApiKey, embeddingApiBaseURL, prompt);

    const myAgent = new MyAgent(mcpClients, providerApiKey, providerApiBaseURL, model, systemPrompt, context);
    await myAgent.init();
    let response;

    logInfo(`Invoking agent with prompt: ${prompt}`);

    response = await myAgent.invoke(prompt);
    // logInfo(`Response: ${JSON.stringify(response, null, 2)}`);

    await myAgent.close();
    return response;
}

async function retrieveContext(embeddingApiKey: string, embeddingApiBaseURL: string, prompt: string) {
    const model = "BAAI/bge-m3";
    const emb = new EmbeddingRetrievers(embeddingApiKey, embeddingApiBaseURL, model);

    const knowledgeDir = path.join(process.cwd(), "knowledge");
    const files = fs.readdirSync(knowledgeDir);
    for (const file of files) {
        const document = fs.readFileSync(path.join(knowledgeDir, file), "utf-8");
        await emb.embedDocument(document);
    }
    const context = await emb.retrieve(prompt);
    logTitle("CONTENT");
    console.log(context);
    return context.map(item => item.document).join("\n");
}

testAgent();
// test('test agent', () => {
//   expect(testAll()).toBe(3);
// });