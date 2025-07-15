import LLMClient from './llm-client.js';
import dotenv from 'dotenv';
import MCPClient from "./mcp-client.js";

async function invokeInvoke() {
    console.log("Starting invokeInvoke...");
    dotenv.config();

    const apiKey = process.env.OPENAI_API_KEY || "";
    // const apiBaseURL = "https://openrouter.ai/api/v1";
    const apiBaseURL = "https://api.groq.com/openai/v1";
    const model = "meta-llama/llama-4-scout-17b-16e-instruct";
    const mcpClients = [new MCPClient(`test-client`, "node", ["C:/Workspace/ai/slack-mcp-server/dist/index.js"])];
    for (const client of mcpClients) {
        await client.init();
    }
    const tools = mcpClients.flatMap(client => client.getTools());
    const client = new LLMClient(apiKey, apiBaseURL, model, tools, "", "");
    const response = await client.invokeInvoke("get my slack channels");

    console.log("response:", response);
    for (const client of mcpClients) {
        await client.close();
    }
}

async function invokeStream() {
    console.log("Starting invokeStream...");
    dotenv.config();

    const apiKey = process.env.OPENAI_API_KEY || "";
    // const apiBaseURL = "https://openrouter.ai/api/v1";
    const apiBaseURL = "https://api.groq.com/openai/v1";
    const model = "meta-llama/llama-4-scout-17b-16e-instruct";
    const mcpClients = [new MCPClient(`test-client`, "node", ["C:/Workspace/ai/slack-mcp-server/dist/index.js"])];
    for (const client of mcpClients) {
        await client.init();
    }
    const tools = mcpClients.flatMap(client => client.getTools());
    const client = new LLMClient(apiKey, apiBaseURL, model, tools, "", "");
    const response = await client.invokeStream("return my slack channels");

    console.log("response:", response); 
    for (const client of mcpClients) {
        await client.close();
    }
}

invokeStream();