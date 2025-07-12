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
    }

    private appendMessages(message: OpenAI.Chat.Completions.ChatCompletionMessageParam) {
        this.messages.push(message);           // Add to end
        if (this.messages.length > 100000) {
            this.messages.shift();            // Remove from front if over limit
        }
    }


    async chat(promt?: string) {
        logInfo(`this.message.length: ${this.messages.length}`);
        

        let content = '';
        const toolCallsMap = new Map<string, ToolCall>();
        try {
            logTitle("REQUEST");
            if (promt) {
                logGreenInfo(promt);
                this.appendMessages({ role: 'user', content: promt });
            } else {
                logGreenInfo("No prompt");
            }

            const stream = await this.openai.chat.completions.create({
                model: this.model,
                messages: this.messages,
                stream: true,
                tools: this.getOpenAITools(),//tell openai the available tools

            });


            logTitle("RESPONSE");

            for await (const part of stream) {
                // logInfo(`Part: ${JSON.stringify(part)}`);
                if (part.choices[0].delta.content) {
                    content += part.choices[0].delta.content;
                    process.stdout.write(part.choices[0].delta.content);
                }


                if (part.choices[0].delta.tool_calls) {
                    // console.log(3);
                    for (const toolCall of part.choices[0].delta.tool_calls) {
                        // logInfo(`toolCall: ${JSON.stringify(toolCall)}`);

                        const key = toolCall.index.toString();
                        // console.log(5 + " key: " +key+": "+(!toolCallsMap.has(key)));
                        if (!toolCallsMap.has(key)) {
                            toolCallsMap.set(key, {
                                id: '',
                                function: {
                                    name: '',
                                    arguments: '',
                                },
                            });
                            // logInfo(`toolCallsMap1: ${[...toolCallsMap.entries()]}`);
                        }

                        const currentToolCall = toolCallsMap.get(key);

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
                        // logInfo(`currentToolCall: ${JSON.stringify(currentToolCall)}`);
                        // logInfo(`toolCallsMap: ${[...toolCallsMap.entries()]}`);
                    }// end for each tool call
                }//handle tools
            }//handle stream end
            process.stdout.write("\n");
            logTitle("END");

        } catch (err) {
            logWarn(`Warn invoking chat: ${err}`);
        }

        //suggested tools by openai
        let toolCalls: ToolCall[] = Array.from(toolCallsMap.values());
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

    public appendToolResult(toolCallId: string, toolOutput: string): void {
        this.appendMessages({
            role: 'tool',
            content: toolOutput,
            tool_call_id: toolCallId,
        });
    }
}   