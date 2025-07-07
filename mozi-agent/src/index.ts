import Bot from './bot.js';

async function askSingleQuestion() {
    const bot = new Bot();
    const res = await bot.askSingleQuestion('What is the capital of France?');
    console.log(res);
    return res;
}
async function autoConversation() {
    const bot = new Bot();
    const res = await bot.autoConversation();
    return res;
}
async function manualConversation() {
    const bot = new Bot();
    await bot.startChat();
    await bot.chat("I am in Shanghai");
    await bot.chat("Where am I");
    await bot.stopChat();
}
manualConversation();

// test('ask and answer', () => {
//     expect(tt()).toBe(3);
// });