// import {logInfo}  from 'tt-ai-agent/logInfo';
// logInfo("Starting tt-ai-provider...");
import Bot  from 'tt-ai-agent/Bot';
const bot = new Bot("C:/Workspace/ai/tt-ai-agent/aiconfig.json");
console.log(await bot.askSingleQuestion('What is the capital of France?'));