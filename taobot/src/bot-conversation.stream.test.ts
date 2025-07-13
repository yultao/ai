import Bot from './bot.js';

const bot = new Bot();
const agentId1 = "my-agent-id-1";
const agentId2 = "my-agent-id-2";
await bot.startConversation(agentId1);
await bot.startConversation(agentId2);
console.log("Q1");
let chatStream = bot.streamContinueConversation(agentId1, "I am in Shanghai");
for await (const chunk of chatStream) {
    process.stdout.write(chunk);
}

console.log("Q2");
chatStream = bot.streamContinueConversation(agentId1, "Where am I");
for await (const chunk of chatStream) {
    process.stdout.write(chunk);
}

console.log("Q3");
chatStream = bot.streamContinueConversation(agentId2, "Where am I");//no context
for await (const chunk of chatStream) {
    process.stdout.write(chunk);
}

console.log("Q4");
chatStream = bot.streamContinueConversation(agentId1, "Where am I");
for await (const chunk of chatStream) {
    process.stdout.write(chunk);
}
await bot.stopConversation(agentId1);
await bot.stopConversation(agentId2);