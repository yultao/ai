import TaoBot from './taobot.js';
const bot = new TaoBot();

if (process.argv.slice(2)[0] === "stream") {
    const stream =  bot.streamChat();
    for await (const chunk of stream) {
        process.stdout.write(chunk);
    }
} else {
    await bot.invokeChat();
}


// 请抓取https://jsonplaceholder.typicode.com/users的内容存储到users.json