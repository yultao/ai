import OpenAIClient from './openai-client.js';
import dotenv from 'dotenv';

async function main() {
    console.log("Starting my-agent...");
    dotenv.config();

    const apiKey = process.env.OPENAI_API_KEY || "";
    const apiBaseURL = process.env.OPENAI_API_BASE || "";
    const client = new OpenAIClient(apiKey, apiBaseURL, 'deepseek/deepseek-chat-v3-0324:free', []);
    const { content, toolCalls } = await client.chat("show me slack channels");

    console.log("content:", content);
    console.log("toolCalls:", toolCalls);
}
main();
