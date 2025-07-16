
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { logInfo, logTitle, logGreenInfo, logWarn, logError } from "./logger.js";
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
    this.availableTools = this.getAvailableTools();
  }

  async invokeInvoke(prompt: string) {
    const url = `${this.apiBaseURL}/chat/completions`;
    console.log(url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        // stream: true,
        tools: this.availableTools,//tell openai the available tools

      })
    });

    console.log("response.ok: " + response.ok);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }
    const res = await response.json();
    console.log("res: " + JSON.stringify(res));
    const content = res.choices[0].message.content;
    let toolCalls: ToolCall[] = [];
    // res.choices[0].message.toolCalls;

    return { content, "toolCalls": res.choices[0].message.toolCalls };
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
          messages: [{
            role: 'user',
            content: prompt
          }],
          stream: true,
          tools: this.availableTools,//tell openai the available tools

        })
      });

      // ✅ 检查 res.body 是否存在
      if (!res.ok || !res.body) {
        throw new Error(`Failed to connect or response body is null: ${res.status}`);
      }
      logTitle("RESPONSE IS");
      const reader = res.body.getReader();
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

  public async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    let content = "";
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
          messages: [{
            role: 'user',
            content: prompt
          }],
          stream: true,
          tools: this.availableTools,//tell openai the available tools

        })
      });

      // ✅ 检查 res.body 是否存在
      if (!res.ok || !res.body) {
        throw new Error(`Failed to connect or response body is null: ${res.status}`);
      }
      logTitle("RESPONSE STREAM");
      const reader = res.body.getReader();
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
              content += part.choices[0].delta.content;
              //process.stdout.write(part.choices[0].delta.content);
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
                //logInfo("current::" + current.id + ", " + current.function?.name + ", " + current.function?.arguments);
                // 实时输出工具调用（拼接完成的部分也可以直接显示）
                const toolId = current.id;
                const toolName = current.function.name;
                const args = current.function.arguments;

                if (toolName && args) {//收齐了
                  const toolCalls = Array.from(suggestedToolCalls.values());
                  this.appendMessages({
                    role: 'assistant',
                    content: content,
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
            }
          }
        }
      }
      process.stdout.write("\n");
      yield "\n";
      logTitle("END STREAM");
    } catch (err) {
      logWarn(`Warn streamChat: ${err}`);
    }
    if (content.trim()) {
      this.appendMessages({
        role: 'assistant',
        content: content,
      });
    }
  }

  private getAvailableTools(): any {
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
