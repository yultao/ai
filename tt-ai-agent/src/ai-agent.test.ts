import MCPClient from './mcp-client.js';
import MyAgent from './ai-agent.js';
import AiConfig from './config.js';
import { logInfo, logTitle } from "./logger.js";
import EmbeddingRetrievers from "./embedding-retrievers.js";
import * as fs from "fs";
import * as path from "path";
import dotenv from 'dotenv';
async function testAgent() {
    logInfo("Starting my-agent...");
    // const prompt = "列出当前目录下文件树形结构，并保存到一个文件dir.txt";
    const prompt = "请抓取https://jsonplaceholder.typicode.com/users的内容，并在knowledge目录中为每个人创建一个md文件，保存基本信息";

    // Initialize MCP clients
    const mcpClients = [
        new MCPClient('fetch-client', `uvx`, ['mcp-server-fetch']),
        new MCPClient('file-client', `npx`, ['-y', "@modelcontextprotocol/server-filesystem", "C:\\Workspace\\ai\\tt-ai-agent"]),

    ];
    dotenv.config();
    const aiConfig = AiConfig.getInstance();
    const apiProviderConfig = aiConfig.getApiProviderConfig();

    const apiKey = process.env.OPENAI_API_KEY || apiProviderConfig.apiKey;
    const apiBaseURL = apiProviderConfig.apiBaseURL;;
    logInfo(`Using API Key: ${apiKey}`);
    logInfo(`Using API Base URL: ${apiBaseURL}`);

            const model = aiConfig.getModelConfig();
        logInfo(`Using model: ${model}`);

const systemPrompt = "You are a helpful assistant.";
    // const context = await retrieveContext(prompt);
    const myAgent = new MyAgent(mcpClients, apiKey, apiBaseURL, model, systemPrompt, "");
    await myAgent.init();
    let response;

    logInfo(`Invoking agent with prompt: ${prompt}`);

    response = await myAgent.invoke(prompt);
    logInfo(`Response: ${JSON.stringify(response, null, 2)}`);

    await myAgent.close();
    return response;
}

async function retrieveContext(prompt: string) {

    const apiKey = process.env.EMBEDDING_API_KEY || "";
    const apiBaseURL = process.env.EMBEDDING_API_BASE_URL || "";
    const model = "BAAI/bge-m3";
    const emb = new EmbeddingRetrievers(apiKey, apiBaseURL, model);

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