import Bot from '../src/bot.js';

async function askSingleQuestion() {
    const bot = new Bot();
    const res = await bot.askSingleQuestion('What is the capital of France?');
    console.log(res);
    return res;
}
async function autoConversation() {
    const bot = new Bot();
    const res = await bot.autoConversation();
    console.log(res);
    return res;
}

autoConversation();

// test('ask and answer', () => {
//     expect(tt()).toBe(3);
// });