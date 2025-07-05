import OpenAIClient from './OpenAIClient.js';
async function main() {
    console.log("Starting my-agent...");

    const client = new OpenAIClient('deepseek/deepseek-chat:free', "", [], 'default');
    const {content, toolCalls} = await client.chat("Hello, how are you?");
    
    console.log("content:", content);
    console.log("toolCalls:", toolCalls);
}
main();
