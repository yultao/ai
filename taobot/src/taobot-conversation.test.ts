import TaoBot from './taobot.js';

const bot = new TaoBot();

if (process.argv.slice(2)[0] === "stream") {
        
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
} else {
    single2();
}


async function multi() {
    const bot = new TaoBot();
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
    const bot = new TaoBot();
    const agentId1 = "my-agent-id-1";
    await bot.startConversation(agentId1);
    await bot.continueConversation(agentId1, "I am in Shanghai");
    await bot.continueConversation(agentId1, "Where am I");
    await bot.stopConversation(agentId1);
}
async function single2() {
    const bot = new TaoBot();
    const agentId1 = "my-agent-id-1";
    await bot.startConversation(agentId1);
    const res = await bot.continueConversation(agentId1, "show me files in the C:\\Workspace\\ai folder");
    console.log(JSON.stringify(res));
    // await bot.continueConversation(agentId1, "Where am I");
    await bot.stopConversation(agentId1);
}
