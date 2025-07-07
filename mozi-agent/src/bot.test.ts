import Bot from './bot.js';

async function askSingleQuestion() {
    const bot = new Bot();
    const res = await bot.askSingleQuestion('Who is Leopoldo Corkery?');
    console.log(res);
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
await askSingleQuestion();
// await conversation();
// await loopChat();

// test('ask and answer', () => {
//     expect(tt()).toBe(3);
// });