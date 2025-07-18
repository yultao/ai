import { logDebug, logError, logInfo, logTitle, logWarn } from "../util/logger.js";
import MCPClient from "../mcp/mcp-client.js";
// import OpenAIClient from "./openai-client.js";
import OpenAIClient from "../llm/llm-client.js";

import { ServerEntry } from "../util/config.js";
export default class AnyNameAgent {
    private mcpServers: ServerEntry[];
    private mcpClients: MCPClient[] = [];
    private llmClient: OpenAIClient | null = null; // Replace with actual type
    private model: string;
    private apiKey: string;
    private apiBaseURL: string;
    private systemPrompt: string;
    private context: string;
    constructor(
        mcpServers: ServerEntry[],
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
        this.mcpClients = this.mcpServers.map(server => new MCPClient(`${server.name}-client`, server.command, server.args));
        for (const client of this.mcpClients) {
            await client.init();
        }
        const tools = this.mcpClients.flatMap(client => client.getTools());
        this.llmClient = new OpenAIClient(this.apiKey, this.apiBaseURL, this.model, tools, this.systemPrompt, this.context);

    }

    public async invoke(prompt: string) {
        if (!this.llmClient) {
            throw new Error("OpenAI client is not initialized.");
        }
        let res = "";
        let response = await this.llmClient!.invokeStream(prompt);
        while (true) {
            // console.log("一次调用：要么是tools要么是content： " + JSON.stringify(response));

            //如果工具调用，调用工具
            if (response.toolCalls.length > 0) {
                // 如果有工具调用，处理每个工具调用
                for (const toolCall of response.toolCalls) {
                    //console.log("chunk for tool: " + toolCall.id+", "+toolCall.function.name+", "+toolCall.function.arguments);
                    //logInfo(`Tool call returned by LLM: ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);

                    // Find the MCP client that has the tool
                    const mcpClient = this.mcpClients.find(client => client.getTools().some(tool => tool.name === toolCall.function.name));
                    if (mcpClient) {
                        // Call the tool using the MCP client
                        logDebug(`Executing ${mcpClient.getName()} tool ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);

                        const result = await mcpClient.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
                        logDebug(`Executed  ${mcpClient.getName()} tool ${toolCall.function.name} with result: ${JSON.stringify(result)}`);
                        //console.log("INVOKE: [[[" + JSON.stringify(result) + "]]]")
                        this.llmClient.appendToolResult(toolCall.id, JSON.stringify(result));

                    } else {
                        logWarn(`No MCP client found for tool ${toolCall.function.name}.`);
                        this.llmClient.appendToolResult(toolCall.id, "No MCP client found for this tool.");

                    }
                }
                // 工具调用之后，发送空请求？
                response = await this.llmClient.invokeStream();

                // continue; // Continue to process the next response
            } else {
                res = response.content;//如果没有工具调用，返回内容
                //console.log("INVOKE: " + res);
                break;
            }
        }
        return res;
    }
    public async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
        if (!this.llmClient) {
            throw new Error("OpenAI client is not initialized.");
        }
        const regex = /\[TOOL_CALL]\[ID=(?<id>[^\]]+)]\[NAME=(?<name>[^\]]+)]\[ARGS=(?<args>{.*?})]/;

        let currentPrompt = prompt;

        while (true) {
            const openaiStream = this.llmClient.streamStream(currentPrompt);
            let toolCalled = false;

            for await (const chunk of openaiStream) {
                const toolCallMatch = chunk.match(regex);

                if (toolCallMatch && toolCallMatch.groups) {
                    //console.log("chunk for tool: " + chunk);
                    toolCalled = true;

                    const toolId = toolCallMatch.groups.id.trim();
                    const toolName = toolCallMatch.groups.name.trim();
                    const toolArgsRaw = toolCallMatch.groups.args.trim();

                    logDebug(`[Agent] 正在调用工具 ${toolId}: ${toolName}，参数: ${toolArgsRaw}`);

                    let toolArgs: any;
                    try {
                        toolArgs = JSON.parse(toolArgsRaw);
                    } catch (err) {
                        logWarn(`工具参数 JSON 解析失败: ${toolArgsRaw}`);
                        this.llmClient.appendToolResult(toolId, "Invalid tool arguments.");
                        continue;
                    }

                    const mcpClient = this.mcpClients.find(client =>
                        client.getTools().some(tool => tool.name === toolName)
                    );

                    if (mcpClient) {
                        logDebug(`Executing ${mcpClient.getName()} tool ${toolName} with arguments: ${toolArgs}`);

                        const result = await mcpClient.callTool(toolName, toolArgs);
                        logDebug(`Executed  ${mcpClient.getName()} tool ${toolName} with result: ${JSON.stringify(result)}`);
                        this.llmClient.appendToolResult(toolId, JSON.stringify(result));
                    } else {
                        logWarn(`未找到对应工具: ${toolId}:${toolName}`);
                        this.llmClient.appendToolResult(toolId, `No MCP client found for ${toolName}`);
                    }

                    // 工具调用后，重新发起新的 stream，请求后续内容
                    break; // break for-await, go to next while-loop
                } else {
                    yield chunk; // 普通内容
                }
            }

            if (!toolCalled) {
                break; // 没有工具调用，结束整个 stream
            }

            // 清空 prompt，后续工具执行后不再传入初始 prompt
            currentPrompt = "";
        }
    }

    public async close() {
        // Close all MCP clients
        for (const client of this.mcpClients) {
            await client.close();
        }
    }
}