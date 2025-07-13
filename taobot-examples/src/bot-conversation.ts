
import Bot  from 'tt-agent/Bot';
const bot = new Bot("C:/Workspace/ai/mozi-agent/aiconfig.json");
await bot.startConversation();
console.log(await bot.continueConversation("I am in Shanghai"));//Shanghai! The Pearl of the Orient
console.log(await bot.continueConversation("Where am I?"));//You are in Shanghai!
await bot.stopConversation();