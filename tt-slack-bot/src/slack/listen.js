import Slack from '@slack/bolt';
import dotenv from 'dotenv';
import Bot from 'tt-ai-agent/Bot';

// Set up a Slack app with:
// Scopes: app_mentions:read, channels:history, chat:write, channels:read

// Event Subscriptions: message.channels
//winget install ngrok
// yultao@TT15 MINGW64 /c/Workspace/ttool/tool-slack (main)
// $ npx ngrok config add-authtoken 2zBCol6aDBpDFrV3U5sYjPvn2n1_5RaKkKmBPcQbQqJXxcUsB
// Authtoken saved to configuration file: C:\Users\yulta\AppData\Local/ngrok/ngrok.yml

// Bot must be added to the channel
dotenv.config();

const app = new Slack.App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});
const bot = new Bot("C:/Workspace/ai/tt-ai-agent/aiconfig.json");
bot.startConversation();

const userId = "U093KDK0PPW";

// Define a reusable message handler function
async function handleMessage({ message, say }) {

  // Ignore bot messages
  if (message.subtype === 'bot_message') return;


  console.log(`📨 New message in channel ${message.channel}: ${message.text}`);

  try {
    const mentionsUser = message.text.includes(`<@${userId}>`);
    if (mentionsUser) {
      const regex = new RegExp(`<@${userId}>`, 'g');
      const text = message.text.replace(regex, "");
      // await say({
      //   text: `Hi <@${message.user}>!`,
      //   thread_ts: message.ts
      // });

      // Send message to tt-ai-agent
console.log('✅ text:', text);
      const replyText = await bot.tell(text) || '✅ Received.';

      // Send the response back to Slack
      await say({
        text: replyText,
        thread_ts: message.ts
      });

      console.log('✅ Replied in Slack:', replyText);
    } else {
      const replyText = await bot.tell(message.text);
      console.log('✅ Received in Slack:', message.text, replyText);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

}

// Register the function to the message event
app.message(handleMessage);
// Start the app and run the message fetch
(async () => {
  await app.start(3000);
  bot.stopConversation();
  console.log('⚡️ Bolt app is running on port 3000');
})();