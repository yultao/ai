
import MyAgent from './agent.js';
import AiConfig from '../util/config.js';

import KnowledgeContext from '../rag/knowledge-context.js';
import { logInfo, logTitle } from "../util/logger.js";

import dotenv from 'dotenv';


async function testAgent() {
    logInfo("Starting my-agent...");
    // const prompt = "列出当前目录下文件树形结构，并保存到一个文件dir.txt";
    // const prompt = "请抓取https://jsonplaceholder.typicode.com/users的内容，并在knowledge目录中为每个人创建一个md文件，保存基本信息，文件名以人名字命名，空格以-替代。";
    // const prompt = "根据Delphine的基本信息，写一个关于他的BIO，并保存到bio目录，以人名字命名的md文件。";
    // const prompt = "Based on Delphine's basic information, write a BIO about him and save it to the bio directory as an md file named after the person.";
    // const prompt = "get my slack messages";
    const prompt = "Give me a brief introduction to Ottawa";

    const aiConfig = new AiConfig("config.json");
    const servers = aiConfig.getMcpServerConfigs();
    const mcpServers = servers.filter(server => !server.disabled);
    logInfo(`Using MCP servers: ${JSON.stringify(mcpServers)}`);

    dotenv.config();
    const { name: providerName, config: apiProviderConfig } = aiConfig.getEnabledApiProvider();

    const providerApiKey = process.env[apiProviderConfig.apiKey]||"";
    const providerApiBaseURL = apiProviderConfig.apiBaseURL;;
    logInfo(`Using API Key: ${providerApiKey}`);
    logInfo(`Using API Base URL: ${providerApiBaseURL}`);

    const { name: model, config: modelConfig } = aiConfig.getEnabledModel();
    logInfo(`Using model: ${model}`);

    const systemPrompt = "You are a helpful assistant.";
    logInfo(`Using system prompt: ${systemPrompt}`);

    const embeddingConfig = aiConfig.getEmbeddingConfig();
    logInfo(`Using Embedding model: ${embeddingConfig.model}`);

    const knowledgeDir = "knowledge";
    
    const knowledgeContext = new KnowledgeContext(embeddingConfig.model, knowledgeDir);
    const context = await knowledgeContext.retrieveContext(prompt);
    const myAgent = new MyAgent(mcpServers, providerApiKey, providerApiBaseURL, model, systemPrompt, context);
    await myAgent.init();
    let response;

    logInfo(`Invoking agent with prompt: ${prompt}`);

    // response = await myAgent.invoke(prompt);
    // logInfo(`Response: ${JSON.stringify(response, null, 2)}`);

    for await (const chunk of myAgent.stream(prompt)) {
        process.stdout.write(chunk);
    }
    await myAgent.close();
    return response;
}



testAgent();
// test('test agent', () => {
//   expect(testAll()).toBe(3);
// });