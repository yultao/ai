import OpenAIClient from './openai-client.js';
async function main() {
    console.log("Starting my-agent...");

    const client = new OpenAIClient('deepseek/deepseek-chat-v3-0324:free', "", [], 'default');
    const {content, toolCalls} = await client.chat("show me slack channels");
    
    console.log("content:", content);
    console.log("toolCalls:", toolCalls);
}
main();
