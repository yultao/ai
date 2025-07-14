import { logError, logInfo, logTitle } from "./logger.js";
import MCPClient from "./mcp-client.js";
import OpenAIClient from "./openai-client.js";

import { ServerEntry } from "./config.js";
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
        // Initialize OpenAI client with the provided model, system prompt, tools, and context
        this.openAIClient = new OpenAIClient(this.apiKey, this.apiBaseURL, this.model, tools, this.systemPrompt, this.context);

    }

    public async invoke(prompt: string) {
        if (!this.openAIClient) {
            throw new Error("OpenAI client is not initialized.");
        }
        let res = "";
        let response = await this.openAIClient!.invoke(prompt);
        while (true) {
            // console.log("一次调用：要么是tools要么是content： " + JSON.stringify(response));

            //如果工具调用，调用工具
            if (response.toolCalls.length > 0) {
                // 如果有工具调用，处理每个工具调用
                for (const toolCall of response.toolCalls) {
                    console.log("chunk for tool: " + toolCall.id+", "+toolCall.function.name+", "+toolCall.function.arguments);
                    //logInfo(`Tool call returned by LLM: ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);

                    // Find the MCP client that has the tool
                    const mcpClient = this.mcpClients.find(client => client.getTools().some(tool => tool.name === toolCall.function.name));
                    if (mcpClient) {
                        // Call the tool using the MCP client
                        logInfo(`Executing ${mcpClient.getName()} tool ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`);

                        const result = await mcpClient.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
                        // logInfo(`Executed  ${mcpClient.getName()} tool ${toolCall.function.name} with result: ${JSON.stringify(result)}`);
                        console.log("INVOKE: [[[" + JSON.stringify(result) + "]]]")
                        this.openAIClient.appendToolResult(toolCall.id, JSON.stringify(result));

                    } else {
                        logInfo(`No MCP client found for tool ${toolCall.function.name}.`);
                        this.openAIClient.appendToolResult(toolCall.id, "No MCP client found for this tool.");

                    }
                }
                // 工具调用之后，发送空请求？
                response = await this.openAIClient.invoke();

                // continue; // Continue to process the next response
            } else {
                res = response.content;//如果没有工具调用，返回内容
                console.log("INVOKE: " + res);
                break;
            }
        }
        return res;
    }
    public async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
        if (!this.openAIClient) {
            throw new Error("OpenAI client is not initialized.");
        }
        const regex = /\[TOOL_CALL]\[ID=(?<id>[^\]]+)]\[NAME=(?<name>[^\]]+)]\[ARGS=(?<args>{.*?})]/;

        let currentPrompt = prompt;

        while (true) {
            const openaiStream = this.openAIClient.stream(currentPrompt);
            let toolCalled = false;

            for await (const chunk of openaiStream) {
                const toolCallMatch = chunk.match(regex);

                if (toolCallMatch && toolCallMatch.groups) {
                    console.log("chunk for tool: " + chunk);
                    toolCalled = true;

                    const toolId = toolCallMatch.groups.id.trim();
                    const toolName = toolCallMatch.groups.name.trim();
                    const toolArgsRaw = toolCallMatch.groups.args.trim();

                    logInfo(`[Agent] 正在调用工具 ${toolId}: ${toolName}，参数: ${toolArgsRaw}`);

                    let toolArgs: any;
                    try {
                        toolArgs = JSON.parse(toolArgsRaw);
                    } catch (err) {
                        logInfo(`工具参数 JSON 解析失败: ${toolArgsRaw}`);
                        this.openAIClient.appendToolResult(toolId, "Invalid tool arguments.");
                        continue;
                    }

                    const mcpClient = this.mcpClients.find(client =>
                        client.getTools().some(tool => tool.name === toolName)
                    );

                    if (mcpClient) {
                        const result = await mcpClient.callTool(toolName, toolArgs);
                        logInfo(`调用工具 ${toolId}:${toolName} 成功: ${JSON.stringify(result)}`);
                        this.openAIClient.appendToolResult(toolId, JSON.stringify(result));
                    } else {
                        logInfo(`未找到对应工具: ${toolId}:${toolName}`);
                        this.openAIClient.appendToolResult(toolId, `No MCP client found for ${toolName}`);
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
    public async *stream22(prompt: string): AsyncGenerator<string, void, unknown> {
        if (!this.openAIClient) {
            throw new Error("OpenAI client is not initialized.");
        }
        const regex = /\[TOOL_CALL]\[ID=(?<id>[^\]]+)]\[NAME=(?<name>[^\]]+)]\[ARGS=(?<args>{.*})]/;
        let openaiStream = this.openAIClient.stream(prompt);
        // while (true) {
        for await (const chunk of openaiStream) {
            // 检查是不是工具调用标记
            const toolCallMatch = chunk.match(regex);


            if (toolCallMatch) {
                const toolId = toolCallMatch[1].trim();    // call_haXqUuVbTtCqOOig3gQABQ
                const toolName = toolCallMatch[2].trim();  // read-slack-conversations
                const toolArgs = toolCallMatch[3].trim();  // {}
                // 假设你有一个调用工具的函数，且支持流式返回结果
                // const toolStream = this.callTool(toolId, toolName, toolArgs);

                // for await (const toolOutput of toolStream) {
                //     // 把工具执行过程中的内容流式返回给用户
                //     yield toolOutput;
                // }


                // 这里举个例子，真实调用根据你工具接口改写
                logInfo(`[Agent] 正在调用工具 ${toolId}: ${toolName}，参数: ${toolArgs} ...`);
                const mcpClient = this.mcpClients.find(client => client.getTools().some(tool => tool.name === toolName));
                if (mcpClient) {
                    // Call the tool using the MCP client
                    // logInfo(`Executing ${mcpClient.getName()} tool ${name} with arguments: ${args}`);

                    const result = await mcpClient.callTool(toolName, JSON.parse(toolArgs));
                    // logInfo(`Executed  ${mcpClient.getName()} tool ${name} with result: ${JSON.stringify(result)}`);
                    console.log("STEAMING: [[[" + JSON.stringify(result) + "]]]")
                    // yield JSON.stringify(result);
                    this.openAIClient.appendToolResult(toolId, JSON.stringify(result));

                } else {
                    logInfo(`No MCP client found for tool ${toolName}.`);
                    this.openAIClient.appendToolResult(toolId, "No MCP client found for this tool.");
                }
                logInfo(`\n工具 ${toolName} 执行完毕`);

                // logInfo("工具调用结束，发个空的请求");
                // 工具调用结束后，继续接收openaiClient输出
            } else {
                // 普通文本直接返回
                logInfo("chunk: " + chunk);
                yield chunk;
            }
        }
        // }
    }

    // 示例工具调用函数（需要你自己实现）
    private async *callTool(id: string, name: string, args: string): AsyncGenerator<string> {
        if (!this.openAIClient) {
            throw new Error("OpenAI client is not initialized.");
        }
        // 这里举个例子，真实调用根据你工具接口改写
        logInfo(`[Agent] 正在调用工具 ${id}: ${name}，参数: ${args} ...`);
        const mcpClient = this.mcpClients.find(client => client.getTools().some(tool => tool.name === name));
        if (mcpClient) {
            // Call the tool using the MCP client
            // logInfo(`Executing ${mcpClient.getName()} tool ${name} with arguments: ${args}`);

            const result = await mcpClient.callTool(name, JSON.parse(args));
            // logInfo(`Executed  ${mcpClient.getName()} tool ${name} with result: ${JSON.stringify(result)}`);
            console.log("STEAMING: [[[" + JSON.stringify(result) + "]]]")
            yield JSON.stringify(result);
            this.openAIClient.appendToolResult(id, JSON.stringify(result));

        } else {
            logInfo(`No MCP client found for tool ${name}.`);
            this.openAIClient.appendToolResult(id, "No MCP client found for this tool.");
        }
        logInfo(`\n工具 ${name} 执行完毕`);
        //yield `\n工具 ${name} 执行完毕。`;
    }

    public async close() {
        // Close all MCP clients
        for (const client of this.mcpClients) {
            await client.close();
        }
    }
}