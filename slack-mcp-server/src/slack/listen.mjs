import Slack from '@slack/bolt';
import dotenv from 'dotenv';
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

console.log("Slack read app initialized with signing secret and bot token");
console.log("Slack needs a public endpoint to send events to.");

// Define a reusable message handler function
async function handleMessage({ message, say }) {

  // Ignore bot messages
  if (message.subtype === 'bot_message') return;


  console.log(`📨 New message in channel ${message.channel}: ${message.text}`);

  try {
    await say(`Got your message: "${message.text}"`);

    // Send message to Cline
    const clineResponse = await axios.post(process.env.CLINE_ENDPOINT, {
      user: message.user,
      text: message.text,
      channel: message.channel,
      ts: message.ts,
    });

    const replyText = clineResponse.data.reply || '✅ Received.';

    // Send the response back to Slack
    await say(replyText);

    console.log('✅ Replied in Slack:', replyText);
  } catch (err) {
    console.error('❌ Error forwarding to Cline:', err.message);
    await say('⚠️ Error talking to the client system.');
  }

}

// Register the function to the message event
app.message(handleMessage);
// Start the app and run the message fetch
(async () => {
  await app.start(3000);
  console.log('⚡️ Bolt app is running on port 3000');
})();