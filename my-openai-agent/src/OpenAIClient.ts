import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import logInfo from "./Logger.js";

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
        this.tools = [];
    }

    async chat(promt?:string) {
        logInfo("CHAT");
        console.log(promt);
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

        logInfo("RESPONSE");

        for await (const part of stream) {
            
            if (part.choices[0].delta.content) {
                content += part.choices[0].delta.content;
                process.stdout.write(part.choices[0].delta.content);
            }


            if (part.choices[0].delta.tool_calls) {
                for (const toolCall of part.choices[0].delta.tool_calls) {
                    // Ensure toolCalls has enough space for the current index
                    if(toolCalls.length <= toolCall.index) {
                        toolCalls.push({
                            id: '',
                            function: {
                                name: '',
                                arguments: '',
                            },
                        }); 
                    }
                    // Update the tool call at the current index
                    let currentToolCall = toolCalls[toolCall.index];

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
                }
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

    private getOpenAITools(): any{
        return this.tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            },
        }));
    }

    public appendToolResult(toolCallId: string, toolOutput: string): void {
        this.messages.push({
            role: 'tool',
            content: toolOutput,
            tool_call_id: toolCallId,
        });
    }
}   