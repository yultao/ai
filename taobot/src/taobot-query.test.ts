import TaoBot from './taobot.js';

const bot = new TaoBot();
if (process.argv.slice(2)[0] === "stream") {
    const chatStream = bot.streamQuery('Read my local dir');
    for await (const chunk of chatStream) {
        process.stdout.write(chunk);
    }
} else {
    const res = await bot.invokeQuery('Read my local dir');
    console.log(res);
}