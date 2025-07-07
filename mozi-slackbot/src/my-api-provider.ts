
import express from 'express';
import dotenv from 'dotenv';
import axios from "axios";

dotenv.config();
const apiKey = process.env.API_PROVIDER_KEY!;
const baseURL = process.env.API_PROVIDER_BASE_URL || "https://openrouter.ai/api/v1";
const model = process.env.LLM_MODEL || "deepseek/deepseek-chat:free";

const app = express();
const port = process.env.PORT || 3000;

app.get('/chat/completions', async (_req, res) => {
  callLLM("Hello, how are you?").then(response => {
    res.json(response.data);
  }).catch(error => {
    console.error("Error calling LLM:", error);
    res.status(500).json({ error: "Failed to call LLM" });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


export async function callLLM(prompt: string): Promise<any> {
  const response = await axios.post(`${baseURL}/chat/completions`, {
    model,
    messages: [{ role: "user", content: prompt }],
  }, {
    headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  return response;
}