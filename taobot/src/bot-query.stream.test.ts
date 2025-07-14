import Bot from './bot.js';

const bot = new Bot();
const chatStream = bot.streamQuery('Read my local dir');
for await (const chunk of chatStream) {
    process.stdout.write(chunk);
}