import Bot from './bot.js';

async function askSingleQuestion() {
    const bot = new Bot();
    // const res = await bot.askSingleQuestion('Who is Leopoldo Corkery?');
    const res = await bot.askSingleQuestion('get my slack msgs');
   
}

async function conversation() {
    const bot = new Bot();
    await bot.startConversation();
    bot.continueConversation("I am in Shanghai");
    bot.continueConversation("Where am I");
    await bot.stopConversation();
}


async function loopChat() {
    const bot = new Bot();
    await bot.loopChat();
}
// await askSingleQuestion();
// await conversation();
await askSingleQuestion();

// test('ask and answer', () => {
//     expect(tt()).toBe(3);
// });