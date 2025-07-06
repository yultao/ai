import Bot from '../src/bot.js';

async function tt() {
    const bot = new Bot();
    const res = await bot.ask('What is the capital of France?');
    console.log(res);
    return res;
}
test('ask and answer', () => {
    expect(tt()).toBe(3);
});