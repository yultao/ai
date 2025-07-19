import Bot from './bot.js';
const bot = new Bot();
const stream =  bot.streamChat();
for await (const chunk of stream) {
    process.stdout.write(chunk);
}
// 请抓取https://jsonplaceholder.typicode.com/users的内容存储到users.json