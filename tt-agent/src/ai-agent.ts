import { logError, logInfo, logTitle } from "./logger.js";
import MCPClient from "./mcp-client.js";
import OpenAIClient from "./openai-client.js";

import {ServerEntry} from "./config.js";
export default class MyAgent {
    private mcpServers: ServerEntry[];
    private mcpClients: MCPClient[] = [];
    private openAIClient: OpenAIClient | null = null; // Replace with actual type
    private model: string;
    private apiKey: string;
    private apiBaseURL: string;
    private systemPrompt: string;
    private context: string;
    constructor(
        mcpServers: ServerEntry[],
        // mcpClients: MCPClient[] = [],
        apiKey: string,
        apiBaseURL: string,
        model: string,
        systemPrompt: string,
        context: string
    ) {
        this.mcpServers = mcpServers;
        // this.mcpClients = mcpClients;
        this.model = model;
        this.apiKey = apiKey;
        this.apiBaseURL = apiBaseURL;
        this.systemPrompt = systemPrompt;
        this.context = context;
    }

    public async init() {
        logInfo("Initializing agent with model: " + this.model);
        // Initialize MCP clients
        this.mcpClients = this.mcpServers.map(server => new MCPClient(`${server.name}-client`, server.command, server.args));
        for (const client of this.mcpClients) {
            await client.init();
        }

        // Collect tools from all MCP clients
        const tools = this.mcpClients.flatMap(client => client.getTools());
        //logInfo(`Collected ${tools.length} tools from MCP clients.`);
        // Initialize OpenAI client with the provided model, system prompt, tools, and context
        this.openAIClient = new OpenAIClient(this.apiKey, this.apiBaseURL, this.model, tools, this.systemPrompt, this.context);

    }

    public async invoke(prompt: string) {
        if (!this.openAIClient) {
            throw new Error("OpenAI client is not initialized.");
        }

        let response = await this.openAIClient!.chat(prompt);
        while (true) {

            if (response.toolCalls.length > 0) {
                // 如果有工具调用，处理每个工具调用
                for (const toolCall of response.toolCalls) {
                    //logInfo(`Tool call returned by LLM: ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);

                    // Find the MCP client that has the tool
                    const mcpClient = this.mcpClients.find(client => client.getTools().some(tool => tool.name === toolCall.function.name));
                    if (mcpClient) {
                        // Call the tool using the MCP client
                        logInfo(`Executing ${mcpClient.getName()} tool ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);

                        const result = await mcpClient.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
                        // logInfo(`Executed  ${mcpClient.getName()} tool ${toolCall.function.name} with result: ${JSON.stringify(result)}`);

                        this.openAIClient.appendToolResult(toolCall.id, JSON.stringify(result));

                    } else {
                        logInfo(`No MCP client found for tool ${toolCall.function.name}.`);
                        this.openAIClient.appendToolResult(toolCall.id, "No MCP client found for this tool.");

                    }
                }
                // After processing tool calls, continue to get the next response
                response = await this.openAIClient.chat();
                continue; // Continue to process the next response
            }
            //如果没有工具调用，返回内容
            return response.content;
        }
    }



    public async close() {
        // Close all MCP clients
        for (const client of this.mcpClients) {
            await client.close();
        }
    }
}