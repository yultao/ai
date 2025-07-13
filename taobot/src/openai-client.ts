import OpenAI from 'openai';
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logInfo, logTitle, logGreenInfo, logWarn } from "./logger.js";

export interface ToolCall {
    id: string;
    function: {
        name: string;
        arguments: string;
    };
}
export default class OpenAIClient {
    private openai: OpenAI;
    private model: string;
    private tools: Tool[];
    private availableTools: [];
    // Array to hold chat messages
    private messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    constructor(apiKey: string, apiBaseURL: string, model: string, tools: Tool[] = [], systemPrompt: string = "", context: string = '') {

        this.openai = new OpenAI({
            apiKey: apiKey,
            baseURL: apiBaseURL,
        });
        this.model = model;
        this.tools = tools;
        if (systemPrompt) this.appendMessages({ role: 'system', content: systemPrompt });
        if (context) this.appendMessages({ role: 'user', content: context });
        this.availableTools = this.getOpenAITools();
    }

    async invoke(prompt?: string) {
        logInfo(`this.message.length: ${this.messages.length}`);


        let content = '';
        const suggestedToolCalls = new Map<string, ToolCall>();
        try {
            logTitle("REQUEST");
            if (prompt) {
                logGreenInfo(prompt);
                this.appendMessages({ role: 'user', content: prompt });
            } else {
                logGreenInfo("No prompt");
            }

            const stream = await this.openai.chat.completions.create({
                model: this.model,
                messages: this.messages,
                stream: true,
                tools: this.availableTools,//tell openai the available tools

            });


            logTitle("RESPONSE");

            for await (const part of stream) {
                if (part.choices[0].delta.content) {
                    content += part.choices[0].delta.content;
                    process.stdout.write(part.choices[0].delta.content);
                }


                if (part.choices[0].delta.tool_calls) {
                    for (const toolCall of part.choices[0].delta.tool_calls) {

                        const key = toolCall.index.toString();
                        if (!suggestedToolCalls.has(key)) {
                            suggestedToolCalls.set(key, {
                                id: '',
                                function: {
                                    name: '',
                                    arguments: '',
                                },
                            });
                        }

                        const currentToolCall = suggestedToolCalls.get(key);

                        //merge the current tool call
                        if (toolCall.id) {
                            currentToolCall!.id += toolCall.id;
                        }
                        if (toolCall.function) {
                            if (toolCall.function.name) {
                                currentToolCall!.function.name += toolCall.function.name;
                            }
                            if (toolCall.function.arguments) {
                                currentToolCall!.function.arguments += toolCall.function.arguments;
                            }
                        }
                    }// end for each tool call
                }//handle tools
            }//handle stream end
            process.stdout.write("\n");
            logTitle("END");

        } catch (err) {
            logWarn(`Warn invoking chat: ${err}`);
        }

        //suggested tools by openai
        let toolCalls: ToolCall[] = Array.from(suggestedToolCalls.values());
        // push the final message to the messages array
        this.appendMessages({
            role: 'assistant',
            content,
            tool_calls: toolCalls.map(toolCall => ({
                type: 'function',
                id: toolCall.id,
                function: {
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments,
                },
            })),
        });

        return { content, toolCalls };
    }

    public async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
        logTitle("REQUEST STREAM");
        if (prompt) {
            logGreenInfo(prompt);
            this.appendMessages({ role: 'user', content: prompt });
        } else {
            logGreenInfo("No prompt");
        }

        const toolCallsMap = new Map<string, ToolCall>();
        let accumulated = "";

        const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.messages,
            stream: true,
            tools: this.availableTools,
        });
        
        logTitle("RESPONSE STREAM");
        for await (const part of stream) {
            const delta = part.choices[0].delta;

            // 普通内容
            if (delta?.content) {
                accumulated += delta.content;
                yield delta.content;
            }

            // 工具调用内容
            if (delta.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                    const key = toolCall.index.toString();

                    if (!toolCallsMap.has(key)) {
                        toolCallsMap.set(key, {
                            id: '',
                            function: { name: '', arguments: '' },
                        });
                    }

                    const current = toolCallsMap.get(key)!;

                    if (toolCall.id) current.id += toolCall.id;
                    if (toolCall.function?.name) current.function.name += toolCall.function.name;
                    if (toolCall.function?.arguments) current.function.arguments += toolCall.function.arguments;

                    // 实时输出工具调用（拼接完成的部分也可以直接显示）
                    const toolId = current.id;
                    const toolName = current.function.name;
                    const args = current.function.arguments;

                    if (toolName && args) {
                        yield `[TOOL_CALL]: ${toolId}: ${toolName}(${args})`;
                    }
                }
            }
        }
        yield "\n";
        logTitle("END STREAM");

        // 最终合并调用历史
        const toolCalls = Array.from(toolCallsMap.values());
        this.appendMessages({
            role: 'assistant',
            content: accumulated,
            tool_calls: toolCalls.map(tc => ({
                type: 'function',
                id: tc.id,
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                },
            })),
        });
    }

    private getOpenAITools(): any {
        const openapiTools = this.tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            },
        }));
        // logInfo(`OpenAI Tools: ${JSON.stringify(openapiTools)}`);
        return openapiTools;
    }


    private appendMessages(message: OpenAI.Chat.Completions.ChatCompletionMessageParam) {
        this.messages.push(message);           // Add to end
        if (this.messages.length > 100000) {
            this.messages.shift();            // Remove from front if over limit
        }
    }


    public appendToolResult(toolCallId: string, toolOutput: string): void {
        this.appendMessages({
            role: 'tool',
            content: toolOutput,
            tool_call_id: toolCallId,
        });
    }
}   