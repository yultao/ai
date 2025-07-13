import Bot from './bot.js';
const bot = new Bot();
const stream =  bot.streamChat();
for await (const chunk of stream) {
    process.stdout.write(chunk);
}