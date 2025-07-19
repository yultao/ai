import OpenAI from 'openai';
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logInfo, logTitle, logWarn, logError, logDebug } from "../util/logger.js";

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

    async invokeInvoke(prompt?: string) {
        return this.invokeStream(prompt);//todo 
    }

    async invokeStream(prompt?: string) {
        // logInfo(`this.message.length: ${this.messages.length}`);


        let content = '';
        const suggestedToolCalls = new Map<string, ToolCall>();
        try {
            logTitle("REQUEST IS");
            if (prompt) {
                logInfo(prompt);
                this.appendMessages({ role: 'user', content: prompt });
            } else {
                logInfo("No prompt");
            }
            logDebug(JSON.stringify(this.messages));

            const stream = await this.openai.chat.completions.create({
                model: this.model,
                messages: this.messages,
                stream: true,
                tools: this.availableTools,//tell openai the available tools

            });


            logTitle("RESPONSE IS");

            for await (const part of stream) {
                if (part.choices[0].delta.content) {
                    content += part.choices[0].delta.content;
                    process.stdout.write(part.choices[0].delta.content);
                }


                if (part.choices[0].delta.tool_calls) {
                    for (const toolCall of part.choices[0].delta.tool_calls) {

                        const key = toolCall.id || "";
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

            logDebug("content: " + content);
            logDebug("suggestedToolCalls: " + JSON.stringify(Array.from(suggestedToolCalls)));


            logTitle("END IS");

        } catch (err) {
            logWarn(`Warn chat: ${err}`);
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

    public async *streamStream(prompt: string): AsyncGenerator<string, void, unknown> {
        let content = "";
        const suggestedToolCalls = new Map<string, ToolCall>();
        try {
            logTitle("REQUEST STREAM");
            if (prompt) {
                logInfo(prompt);
                this.appendMessages({ role: 'user', content: prompt });
            } else {
                logInfo("No prompt");
            }
            const stream = await this.openai.chat.completions.create({
                model: this.model,
                messages: this.messages,
                stream: true,
                tools: this.availableTools,
            });
            logDebug("req: " + JSON.stringify(this.messages));

            logTitle("RESPONSE STREAM");
            for await (const part of stream) {

                // 普通内容
                if (part.choices[0].delta?.content) {
                    content += part.choices[0].delta.content;
                    yield part.choices[0].delta.content;
                }

                // 工具调用内容
                if (part.choices[0].delta.tool_calls) {
                    logInfo(':'.repeat(part.choices[0].delta.tool_calls.length))
                    logDebug("part: " + JSON.stringify(part.choices[0].delta.tool_calls))
                    for (const toolCall of part.choices[0].delta.tool_calls) {
                        const key = toolCall.index + "";
                        if (!suggestedToolCalls.has(key)) {
                            suggestedToolCalls.set(key, {
                                id: '',
                                function: { name: '', arguments: '' },
                            });
                        }

                        const current = suggestedToolCalls.get(key)!;

                        if (toolCall.id) current.id += toolCall.id;
                        if (toolCall.function?.name) current.function.name += toolCall.function.name;
                        if (toolCall.function?.arguments) current.function.arguments += toolCall.function.arguments;
                        // 实时输出工具调用（拼接完成的部分也可以直接显示）
                        const toolId = current.id;
                        const toolName = current.function.name;
                        const args = current.function.arguments;
                        //一旦得到toolcall，立即存入历史
                        if (toolName && args && this.isLikelyCompleteJson(args)) {
                            const toolCalls = Array.from(suggestedToolCalls.values());
                            this.appendMessages({
                                role: 'assistant',
                                content: content,//此时accumulated为空
                                tool_calls: toolCalls.map(tc => ({
                                    type: 'function',
                                    id: tc.id,
                                    function: {
                                        name: tc.function.name,
                                        arguments: tc.function.arguments,
                                    },
                                })),
                            });
                            logDebug("suggestedToolCalls: " + JSON.stringify(Array.from(suggestedToolCalls)));
                            yield `[TOOL_CALL][ID=${toolId}][NAME=${toolName}][ARGS=${args}]`;
                        }
                    }
                }//if tools
            }
            // process.stdout.write("\n");
            // yield "\n";
            logTitle("END STREAM");
        } catch (err) {
            logWarn(`Warn streamStream: ${err}`);
        }
        if (content.trim()) {
            this.appendMessages({
                role: 'assistant',
                content: content,
            });
        }
        logDebug("content: " + content);
    }
    private isLikelyCompleteJson(str: string): boolean {
        if (!str.startsWith('{') || !str.endsWith('}')) return false;

        try {
            const parsed = JSON.parse(str);
            return typeof parsed === 'object' && parsed !== null;
        } catch {
            return false;
        }
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
        return openapiTools;
    }


    private appendMessages(message: OpenAI.Chat.Completions.ChatCompletionMessageParam) {
        this.messages.push(message);           // Add to end
        while (this.messages.length > 20) {
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