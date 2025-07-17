import Bot from './bot.js';


const res = await new Bot().invokeQuery('show my slack channels using available mcp tools');
console.log(res)