import Bot from './bot.js';


async function conversation() {
    const bot = new Bot();
    await bot.startConversation();
    bot.continueConversation("I am in Shanghai");
    bot.continueConversation("Where am I");
    await bot.stopConversation();
}
const res = await new Bot().query('Introduce Canada');