// src/modelFactory.ts

import { ChatOpenAI } from "@langchain/openai";
import { config } from "./config.js";
import dotenv from "dotenv";

dotenv.config();

export function createModel(): ChatOpenAI {
  const { provider, modelName } = config;

  if (provider === "openai") {
    return new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName,
    });
  }

  if (provider === "openrouter") {
    return new ChatOpenAI({
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      modelName,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
