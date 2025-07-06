import {logInfo,logTitle} from "./logger.js";
import MCPClient from "./mcp-client.js";
import OpenAIClient from "./openai-client.js";


export default class MyAgent {
    private mcpClients: MCPClient[];
    private openAIClient: OpenAIClient | null = null; // Replace with actual type
    private context: string;
    private model: string;
    private systemPrompt: string;

    constructor(
        mcpClients: MCPClient[] = [],
        context: string = "default",
        model: string,
        systemPrompt: string
    ) {
        this.mcpClients = mcpClients;
        this.context = context;
        this.model = model;
        this.systemPrompt = systemPrompt;
    }

    public async init() {
        logInfo("Initializing MyAgent with model: " + this.model );
        // Initialize MCP clients
        for (const client of this.mcpClients) {
            await client.init();
        }

        // Collect tools from all MCP clients
        const tools = this.mcpClients.flatMap(client => client.getTools());
        logInfo(`Collected ${tools.length} tools from MCP clients.`);
        // Initialize OpenAI client with the provided model, system prompt, tools, and context
        this.openAIClient = new OpenAIClient(this.model, this.systemPrompt, tools, this.context);

    }

    public async invoke (prompt: string) {
        if(!this.openAIClient) {
            throw new Error("OpenAI client is not initialized.");
        }
       
        // Invoke the OpenAI client with the provided prompt
        let response = await this.openAIClient.chat(prompt);
        while (true) {
            if (response.toolCalls.length > 0) {
                // 如果有工具调用，处理每个工具调用
                for (const toolCall of response.toolCalls) {
                    logInfo(`Tool call returned by LLM: ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);

                    // Find the MCP client that has the tool
                    const mcpClient = this.mcpClients.find(client => client.getTools().some(tool => tool.name === toolCall.function.name));
                    if (mcpClient) {
                        // Call the tool using the MCP client
                        logInfo(`Executing ${mcpClient.getName()} tool ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);
                        
                        const result = await mcpClient.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
                        logInfo(`Executed  ${mcpClient.getName()} tool ${toolCall.function.name} with result: ${JSON.stringify(result)}`);
                       
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
            logInfo(`Tool call done`);
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