import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {logInfo,logTitle} from "./logger.js";

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

    constructor(model: string, systemPrompt: string, tools: Tool[] = [], context: string = 'default') {
        dotenv.config();
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_API_BASE,
        });

        this.model = model;
        this.tools = tools;
    }

    async chat2(promt?:string) {
        logTitle("CHAT");
        if (promt) {
            this.messages.push({ role: 'user', content: promt });
        }

        const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.messages,
            stream: true,
            tools: this.getOpenAITools(),
            
        });

        let content = '';
        let toolCalls: ToolCall[] = [];

        logTitle("RESPONSE");

        for await (const part of stream) {
            // logInfo(`Part: ${JSON.stringify(part)}`);
            if (part.choices[0].delta.content) {
                content += part.choices[0].delta.content;
                process.stdout.write(part.choices[0].delta.content);
            }


            if (part.choices[0].delta.tool_calls) {
                console.log(3);
                for (const toolCall of part.choices[0].delta.tool_calls) {
                    console.log(4 + ": " +JSON.stringify(toolCall));
                    // Ensure toolCalls has enough space for the current index
                    if(toolCalls.length < toolCall.index) {//0, index:1
                        console.log(5);
                        toolCalls.push({
                            id: '',
                            function: {
                                name: '',
                                arguments: '',
                            },
                        }); 
                    }
                    console.log("toolCall: ", JSON.stringify(toolCall));
                    console.log("toolCalls: ", JSON.stringify(toolCalls), "length: ", toolCalls.length);
                    // Update the tool call at the current index
                    let currentToolCall = toolCalls[toolCall.index-1];
                    console.log(`currentToolCall: ${JSON.stringify(currentToolCall)}`);
                    if( toolCall.id) {
                        currentToolCall.id += toolCall.id;
                    }
                    if (toolCall.function) {
                        if (toolCall.function.name) {
                            currentToolCall.function.name += toolCall.function.name;
                        }
                        if (toolCall.function.arguments) {
                            currentToolCall.function.arguments += toolCall.function.arguments;
                        }
                    }

                    logInfo(`Current tool call: ${JSON.stringify(currentToolCall)}`);
                }// end for each tool call
            }
        }
        process.stdout.write("\nEND\n");
        // push the final message to the messages array
        this.messages.push({ 
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
        // Filter out any undefined tool calls
        return {content, toolCalls};
    }

    async chat(promt?:string) {
        logTitle("REQUEST");
        if (promt) {
            logInfo(promt);
            this.messages.push({ role: 'user', content: promt });
        }

        const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: this.messages,
            stream: true,
            tools: this.getOpenAITools(),
            
        });

        let content = '';
        
        const toolCallsMap = new Map<string, ToolCall>();

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
                    logInfo(`toolCall: ${JSON.stringify(toolCall)}`);
                    
                    const key = toolCall.index.toString();
                    // console.log(5 + " key: " +key+": "+(!toolCallsMap.has(key)));
                    if (!toolCallsMap.has(key)) {
                        toolCallsMap.set(key, {
                            id:  '',
                            function: {
                                name:  '',
                                arguments: '',
                            },
                        });
                        // logInfo(`toolCallsMap1: ${[...toolCallsMap.entries()]}`);
                    }

                    const currentToolCall = toolCallsMap.get(key);

                    //merge the current tool call
                   if( toolCall.id) {
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
                    logInfo(`currentToolCall: ${JSON.stringify(currentToolCall)}`);
                    logInfo(`toolCallsMap: ${[...toolCallsMap.entries()]}`);
                }// end for each tool call
            }
        }
        process.stdout.write("\n");
        logTitle("END");
        let toolCalls: ToolCall[] = Array.from(toolCallsMap.values());
        // push the final message to the messages array
        this.messages.push({ 
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
        // Filter out any undefined tool calls
        return {content, toolCalls};
    }

    private getOpenAITools(): any{
        const openapiTools= this.tools.map(tool => ({
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
        this.messages.push({
            role: 'tool',
            content: toolOutput,
            tool_call_id: toolCallId,
        });
    }
}   