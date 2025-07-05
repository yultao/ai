import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.API_PROVIDER_KEY!;
const baseURL = process.env.API_PROVIDER_BASE_URL || "https://openrouter.ai/api/v1";
const model = process.env.LLM_MODEL || "deepseek/deepseek-chat:free";

export async function callLLM(prompt: string): Promise<string> {
  const response = await axios.post(`${baseURL}/chat/completions`, {
    model,
    messages: [{ role: "user", content: prompt }],
  }, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.data.choices[0].message.content;
}