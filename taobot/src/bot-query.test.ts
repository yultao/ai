import Bot from './bot.js';


async function conversation() {
    const bot = new Bot();
    await bot.startConversation("a");
    bot.continueConversation("a","I am in Shanghai");
    bot.continueConversation("a","Where am I");
    await bot.stopConversation("a");
}
const res = await new Bot().query('Introduce Canada');