#!/usr/bin/env node
import MCPClient from './mcp-client.js';
import MyAgent from './agent.js';
import {logInfo,logTitle} from "./logger.js";
import { getMcpServerConfigs } from './mcp-server-config.js';
import { createInterface } from "readline/promises";

async function main() {
    logInfo("Starting my-agent...");

    const args = process.argv.slice(2);
    console.log(args);


    // Example usage
    const servers = getMcpServerConfigs();
    const activeServers = servers.filter(server => !server.disabled);
    console.log(activeServers);


    // Dynamically create MCPClient instances from servers
    const mcpClients = activeServers
        .map(server => {
            const clientName = `${server.name}-client`;
            return new MCPClient(clientName, server.command, server.args);
        });
    const model = args[0] || "deepseek/deepseek-chat-v3-0324:free";//|| "deepseek/deepseek-chat:free";
    // const model = "openai/gpt-3.5-turbo-1106";
    // const model = "deepseek-chat";
    /*
        deepseek/deepseek-chat-v3-0324:free	Free, strong at reasoning, supports tool use 
        mistralai/mistral-small-3.1-24b-instruct:free	Free instruct-tuned Mistral, tool-capable
        x meta-llama/llama-4-maverick:free	Powerful MoE model, free, tool-usable
        x meta-llama/llama-4-scout:free	Compact variant with huge context, free, tool-ready
        x moonshotai/kimi-vl-a3b-thinking:free	Multimodal, free, supports tool-calling
        x nvidia/llama-3.1-nemotron-nano-8b-v1:free	Nano-sized, optimized, tool-enabled
        x google/gemini-2.5-pro-exp-03-25:free	Free Gemini variant with tool support
        x qwen/qwq-32b:free	Free Qwen reasoning model, supports tools
    */
    const myAgent = new MyAgent(mcpClients, 'default', model, "You are a helpful assistant.");
    await myAgent.init();
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    try {
        while (true) {
            const prompt = await rl.question("Enter your prompt (or exit): ");
            if (prompt.trim().toLowerCase() === "exit") {
                break;
            }
            const content = await myAgent.invoke(prompt);
        }
    } catch (error) {
        logInfo(`Error invoking agent: ${error}`);
    } finally {
        await myAgent.close();
        rl.close();
    }
}
main();