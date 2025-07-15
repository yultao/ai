import fetch from 'node-fetch';
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export class LLMClient {
  private apiKey: string;
  private apiBaseURL: string;
  private model: string;
  private tools: Tool[];
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(
    apiKey: string,
    apiBaseURL: string,
    model: string,
    tools: Tool[] = [],
    systemPrompt: string = "",
    context: string = ""
  ) {
    this.apiKey = apiKey;
    this.apiBaseURL = apiBaseURL;
    this.model = model;
    this.tools = tools;
    
    if (systemPrompt) {
      this.appendMessages({ role: 'system', content: systemPrompt });
    }
    if (context) {
      this.appendMessages({ role: 'user', content: context });
    }
  }

  private messages: { role: string; content: string }[] = [];

  async sendRequest(prompt: string) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    return response.json();
  }

  private appendMessages(message: { role: string; content: string }) {
    this.messages.push(message);
    if (this.messages.length > 100000) {
      this.messages.shift();
    }
  }
}
