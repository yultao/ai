import Bot  from './bot.js';
const bot = new Bot();
console.log(await bot.ask('What is the capital of France?'));