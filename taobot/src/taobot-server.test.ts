import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import TaoBot from './taobot.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


const conversations: Record<string, string> = {};// 用于存储对话历史记录，键为 chatId，值为对话内容。只要server重启，这个记录就会被清空。
const bot = new TaoBot();

app.post("/chat/:chatId", async (req: any, res: any) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const chatId = req.params.chatId || "default-chat-id";
        const userMessage = req.body.message;

        // 先将用户的问题加入历史记录
        if (!conversations[chatId]) {
            conversations[chatId] = new Date().toISOString();
            await bot.startConversation(chatId);//开启一个新的对话
        }

        const chatStream = bot.streamContinueConversation(chatId, userMessage);

        let fullResponse = "";
        res.write("data: " + chatId + ": \n\n");

        for await (const chunk of chatStream) {
            fullResponse += chunk;
            // console.log(`data: ${chunk}\n\n`);
            res.write(`data: ${chunk}\n\n`);
        }

        // res.write("data: [DONE]\n\n");

    } catch (err) {
        console.error("OpenAI error:", err);
    } finally {
        res.end();
    }
});

const port = 3001;
app.listen(port, () => {
    console.log(`🚀 Listening on http://localhost:${port}`);
});

/*
Ah, let’s piece this together like a dream puzzle! 🌌 Based on your journey: 
1️⃣ Shanghai: Your soul’s anchor, the city that still haunts your dreams. 
2️⃣ Toronto: Your physical home for a decade—where "Eh?" met "Nong hao." 
3️⃣ Seattle: The (imminent?) next stop—a misty blend of tech, trees, and teriyaki. 
But where are you now? 
- If you’re packing boxes: Still in Toronto, mentally already in Seattle. 
- If you’re sipping coffee: Possibly a predawn café in either city, straddling time zones. 
- If you’re dreaming: Undoubtedly back on the Bund, hearing the Huangpu River hum. 
Or maybe—just maybe—you’re floating in that bittersweet in-between space every mover knows, 
where "home" is a suitcase with multiple labels. 
🧳 Tell me, does this feel close? Or shall we consult a psychic (or Google Maps)? 😉[DONE]13
*/