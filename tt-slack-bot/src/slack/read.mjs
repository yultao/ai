import Slack from '@slack/bolt';
import dotenv from 'dotenv';
//https://www.youtube.com/watch?v=SbUv1nCS7a0&t=476s
dotenv.config();

const app = new Slack.App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

console.log("Slack read app initialized with signing secret and bot token");
    
    console.log('Channel ID:', process.env.SLACK_CHANNEL_ID);
      // 10 hours ago in Unix timestamp
  const now = Math.floor(Date.now() / 1000);
  const tenHoursAgo = now - 10 * 60 * 60;

async function getRecentMessages() {



  try {
    const result = await app.client.conversations.history({
      //token: process.env.SLACK_BOT_TOKEN,
      channel: process.env.SLACK_CHANNEL_ID,
      oldest: tenHoursAgo,
      limit: 100,
    });

    console.log(`Messages from the past 10 hours:`);
    result.messages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.text} (ts: ${msg.ts})`);
    });
  } catch (err) {
    console.error('Failed to fetch messages:', err);
  }
}

async function getMyMessages() {
  try {
    // Step 1: Get G T's user ID
    const users = await app.client.users.list();
    const george = users.members.find(u => u.real_name === 'G T');
    const georgeId = george.id;
console.log(`G T's user ID: ${georgeId}`);

    // Step 2: Get channel messages
    const messagesRes = await app.client.conversations.history({
      channel: process.env.SLACK_CHANNEL_ID,
      oldest: tenHoursAgo,
      limit: 100,
    });

    const messages = messagesRes.messages;

    // Sent by George
    const sentByGeorge = messages.filter(msg => msg.user === georgeId);

    // Mentioning George
    const mentionsGeorge = messages.filter(
      msg => msg.text && msg.text.includes(`<@${georgeId}>`)
    );

    console.log('Messages sent by George:');
    console.log(sentByGeorge.map(m => m.text));

    console.log('Messages mentioning George:');
    console.log(mentionsGeorge.map(m => m.text));
  } catch (err) {
    console.error('Failed to fetch messages:', err);
  }
}

// Start the app and run the message fetch
(async () => {
  await app.start(3030);
  console.log('⚡️ Bolt app is running on port 3030');
  await getMyMessages(); // fetch on startup
})();