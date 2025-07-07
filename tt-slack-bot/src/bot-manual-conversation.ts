
import Bot  from 'tt-ai-agent/Bot';
const bot = new Bot("C:/Workspace/ai/tt-ai-agent/aiconfig.json");
await bot.startChat();
console.log(await bot.chat("I am in Shanghai"));//Shanghai! The Pearl of the Orient
console.log(await bot.chat("Where am I?"));//You are in Shanghai!
await bot.stopChat();