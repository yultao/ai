import { ChatOpenAI } from "@langchain/openai";
import { ModelConfig } from "./config.js";
import dotenv from "dotenv";
dotenv.config();

export function createModel(config: ModelConfig): ChatOpenAI {
  const { provider, modelName, streaming } = config;

  if (provider === "openai") {
    return new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName,
      streaming,
    });
  }

  if (provider === "openrouter") {
    return new ChatOpenAI({
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      modelName,
      streaming,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1"
      },
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
