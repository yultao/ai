import Bot  from 'tt-agent/Bot';
const bot = new Bot("C:/Workspace/ai/mozi-agent/aiconfig.json");
console.log(await bot.askSingleQuestion('What is the capital of France?'));