
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logInfo, logTitle, logGreenInfo, logWarn, logError } from "../util/logger.js";
export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}
export default class LLMClient {
  private apiBaseURL: string;
  private apiKey: string;
  private model: string;
  private tools: Tool[];
  private availableTools: [];

  private messages: any[] = [];
  constructor(apiKey: string, apiBaseURL: string, model: string, tools: Tool[] = [], systemPrompt: string = "", context: string = '') {
    this.apiKey = apiKey;
    this.apiBaseURL = apiBaseURL;
    this.model = model;
    this.tools = tools;
    if (systemPrompt) this.appendMessages({ role: 'system', content: systemPrompt });
    if (context) this.appendMessages({ role: 'user', content: context });
    this.availableTools = this.getOpenAITools();
  }
  /*
  {
    "id": "gen-1752636571-xwlkl2yclMvN4F7HiSP3",
    "provider": "Chutes",
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "object": "chat.completion",
    "created": 1752636571,
    "choices": [
      {
        "logprobs": null,
        "finish_reason": "tool_calls",
        "native_finish_reason": "tool_calls",
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "",
          "refusal": null,
          "reasoning": null,
          "tool_calls": [
            {
              "id": "call_jvv078rjQB6oTUIYKI7JpA",
              "index": 2,
              "type": "function",
              "function": {
                "name": "read-slack-conversations",
                "arguments": "{}"
              }
            }
          ]
        }
      }
    ],
    "usage": {
      "prompt_tokens": 2393,
      "completion_tokens": 19,
      "total_tokens": 2412,
      "prompt_tokens_details": null
    }
  }
  */
  /*
  {
   "id": "gen-1752637310-Of86xrlw0V5aKihmqKdC",
   "provider": "Chutes",
   "model": "deepseek/deepseek-chat-v3-0324:free",
   "object": "chat.completion",
   "created": 1752637310,
   "choices": [
     {
       "logprobs": null,
       "finish_reason": "stop",
       "native_finish_reason": "stop",
       "index": 0,
       "message": {
         "role": "assistant",
         "content": "Here are the details of your Slack channels and recent conversations:\n\n### Channel: **C093KD45H3N-all-tt**\n- **Recent Activity**:\n  1. **User joined**: `<@U093KD43HHA>` joined the channel.\n  2. **Message**: \"This is sent to all-tt\".\n  3. **Message**: \"I did something else in all-tt\".\n  4. **Message**: \"I called ads team for a bug\" (with replies in a thread).\n\nIf you'd like more details or actions on any of these channels, let me know!",
         "refusal": null,
         "reasoning": null
       }
     }
   ],
   "usage": {
     "prompt_tokens": 3445,
     "completion_tokens": 125,
     "total_tokens": 3570,
     "prompt_tokens_details": null
   }
 }
  */
  async invokeInvoke(prompt?: string) {
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

      const url = `${this.apiBaseURL}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.messages,
          tools: this.availableTools,//tell openai the available tools
        })
      });
      
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      logTitle("RESPONSE");
      const res = await response.json();
      // console.log("res: " + JSON.stringify(res));

      content = res.choices[0].message.content;
      logInfo("content: "+content);

      if (res.choices[0].message.tool_calls) {
        for (const toolCall of res.choices[0].message.tool_calls) {
          const key = toolCall.index.toString();
          suggestedToolCalls.set(key, {
            id: toolCall.id,
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            },
          });
        }
      }
      logInfo("suggestedToolCalls: "+JSON.stringify(suggestedToolCalls));
      // res.choices[0].message.toolCalls;
      logTitle("END");
    } catch (err) {
      logWarn(`Warn invokeChat: ${err}`);
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

  async invokeStream(prompt?: string) {
    // logInfo(`this.message.length: ${this.messages.length}`);

    let content = '';
    const suggestedToolCalls = new Map<string, ToolCall>();
    try {
      logTitle("REQUEST IS");
      if (prompt) {
        logGreenInfo(prompt);
        this.appendMessages({ role: 'user', content: prompt });
      } else {
        logGreenInfo("No prompt");
      }
      // logError(JSON.stringify(this.messages));
      const body = await this.callLLM(true);
      const reader = body.getReader();
      const decoder = new TextDecoder("utf-8");
      logTitle("RESPONSE IS");
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        // console.log("===>: " + done);
        if (done) {
          // console.log("while break")
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          // console.log("line===> " + line);

          if (line.startsWith('data: ')) {
            const json = line.slice(6).trim();
            if (json === '[DONE]') {
              // console.log("line break")

              break;
            }
            const part = JSON.parse(json);


            if (part.choices?.[0]?.delta?.content) {
              content += part.choices[0].delta.content;
              process.stdout.write(part.choices[0].delta.content);
              // console.log('∆', content); // or yield delta;
            }

            if (part.choices[0].delta.tool_calls) {
              //console.log(part.choices[0].delta.tool_calls); // or yield delta;
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

          }// end if (line.startsWith('data: '))

        }
        // console.log("222");
      }//end of while
      // console.log("ENDDDD");
      process.stdout.write("\n");
      logTitle("END IS");
    } catch (err) {
      logWarn(`Warn invokeChat: ${err}`);
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
    let accumulated = "";
    const suggestedToolCalls = new Map<string, ToolCall>();
    try {
      logTitle("REQUEST STREAM");
      if (prompt) {
        logGreenInfo(prompt);
        this.appendMessages({ role: 'user', content: prompt });
      } else {
        logGreenInfo("No prompt");
      }
      // logError(JSON.stringify(this.messages));


      const body = await this.callLLM(true);
      logTitle("RESPONSE STREAM");
      const reader = body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        // console.log("===>: " + done);
        if (done) {
          // console.log("while break")
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const json = line.slice(6).trim();
            if (json === '[DONE]') {
              // console.log("line break")
              break;
            }
            const part = JSON.parse(json);

            // 普通内容
            if (part.choices[0].delta?.content) {
              accumulated += part.choices[0].delta.content;
              yield part.choices[0].delta.content;
            }

            // 工具调用内容
            if (part.choices[0].delta.tool_calls) {
              for (const toolCall of part.choices[0].delta.tool_calls) {
                const key = toolCall.index.toString();

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
                if (toolName && args) {
                  const toolCalls = Array.from(suggestedToolCalls.values());
                  this.appendMessages({
                    role: 'assistant',
                    content: accumulated,//此时accumulated为空
                    tool_calls: toolCalls.map(tc => ({
                      type: 'function',
                      id: tc.id,
                      function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                      },
                    })),
                  });

                  yield `[TOOL_CALL][ID=${toolId}][NAME=${toolName}][ARGS=${args}]`;
                }
              }
            }//if tools
          }
        }
      }
      process.stdout.write("\n");
      yield "\n";
      logTitle("END STREAM");
    } catch (err) {
      logWarn(`Warn streamChat: ${err}`);
    }
    if (accumulated.trim()) {
      this.appendMessages({
        role: 'assistant',
        content: accumulated,
      });
    }
  }

  private async callLLM(stream: boolean) {
    const url = `${this.apiBaseURL}/chat/completions`;
    // console.log(url);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.messages,
        stream: stream,
        tools: this.availableTools, //tell openai the available tools
      })
    });

    // ✅ 检查 res.body 是否存在
    if (!res.ok || !res.body) {
      throw new Error(`Failed to connect or response body is null: ${res.ok},${res.body},${JSON.stringify(res)}`);
    }


    return res.body;
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

  private appendMessages(message: any) {
    this.messages.push(message);           // Add to end
    if (this.messages.length > 100000) {
      this.messages.shift();            // Remove from front if over limit
    }
  }

}
