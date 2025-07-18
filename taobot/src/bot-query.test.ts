import Bot from './bot.js';


const res = await new Bot().invokeQuery('Read my local dir');
console.log(res)