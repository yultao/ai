import Bot from './bot.js';

const bot = new Bot();
const chatStream = bot.streamQuery('Get my slack messages using slack mcp server');
for await (const chunk of chatStream) {
    process.stdout.write(chunk);
}