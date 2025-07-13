// src/config.ts

export type Provider = "openai" | "openrouter";

export interface ModelConfig {
  provider: Provider;
  modelName: string;
}

export const config: ModelConfig = {
  provider: "openrouter", // 切换为 "openai" / "openrouter"
  modelName: "deepseek/deepseek-chat-v3-0324:free", // 可换为 gpt-4 等     message: 'mistral/mistral-7b-instruct is not a valid model ID',
};
