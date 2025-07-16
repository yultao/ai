import Bot from './bot.js';

async function multi() {
    const bot = new Bot();
    const agentId1 = "my-agent-id-1";
    const agentId2 = "my-agent-id-2";
    await bot.startConversation(agentId1);
    await bot.startConversation(agentId2);
    await bot.continueConversation(agentId1, "I am in Shanghai");
    await bot.continueConversation(agentId1, "Where am I");
    await bot.continueConversation(agentId2, "Where am I");//no context
    await bot.continueConversation(agentId1, "Where am I");
    await bot.stopConversation(agentId1);
    await bot.stopConversation(agentId2);
}

async function single() {
    const bot = new Bot();
    const agentId1 = "my-agent-id-1";
    await bot.startConversation(agentId1);
    await bot.continueConversation(agentId1, "I am in Shanghai");
    await bot.continueConversation(agentId1, "Where am I");
    await bot.stopConversation(agentId1);
}
async function single2() {
    const bot = new Bot();
    const agentId1 = "my-agent-id-1";
    await bot.startConversation(agentId1);
    const res = await bot.continueConversation(agentId1, "show me files in the C:\\Workspace\\ai folder");
    console.log(JSON.stringify(res));
    // await bot.continueConversation(agentId1, "Where am I");
    await bot.stopConversation(agentId1);
}
single2();