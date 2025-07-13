import Bot from './bot.js';

const bot = new Bot();
await bot.startConversation();
bot.continueConversation("I am in Shanghai");
bot.continueConversation("Where am I");
await bot.stopConversation();