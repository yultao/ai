import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import dotenv from 'dotenv';




import Bot from './bot.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


const conversations: Record<string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]> = {};
const bot = new Bot();

app.post("/chat/:chatId", async (req: any, res: any) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const chatId = req.params.chatId || "default-chat-id";
        const userMessage = req.body.message;
        
        // 先将用户的问题加入历史记录
        if (!conversations[chatId]) {
            conversations[chatId] = [
                { role: "system", content: "You are a helpful assistant." }
            ];
            await bot.startConversation(chatId);//开启一个新的对话
        }

        const chatStream = bot.streamContinueConversation(chatId, userMessage);

        let fullResponse = "";
        res.write("data: "+ chatId +": \n\n");

        for await (const chunk of chatStream) {
            fullResponse += chunk;
            // console.log(`data: ${chunk}\n\n`);
            res.write(`data: ${chunk}\n\n`);
        }
       
        res.write("data: [DONE]\n\n");
        res.end();
    } catch (err) {
        console.error("OpenAI error:", err);
        res.write("data: [ERROR]\n\n");
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