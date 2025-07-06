
import Bot  from 'tt-ai-agent/Bot';
const bot = new Bot("C:/Workspace/ai/tt-ai-agent/aiconfig.json");
await bot.startConversation();
console.log(await bot.tell("I am in Shanghai"));//Shanghai! The Pearl of the Orient
console.log(await bot.tell("Where am I?"));//You are in Shanghai!
await bot.stopConversation();