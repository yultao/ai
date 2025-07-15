export type Provider = "openai" | "openrouter";

export interface ModelConfig {
  provider: Provider;
  modelName: string;
  streaming?: boolean;
}

export const modelConfigs: Record<string, ModelConfig> = {
  summarize: {
    provider: "openai",
    modelName: "gpt-3.5-turbo",
  },
  creative: {
    provider: "openrouter",
    modelName: "mistralai/mistral-7b-instruct",
    streaming: true,
  },
};
