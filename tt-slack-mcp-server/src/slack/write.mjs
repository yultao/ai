import Slack from '@slack/bolt';
import dotenv from 'dotenv';
//https://www.youtube.com/watch?v=SbUv1nCS7a0&t=476s
dotenv.config();
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackBotToken = process.env.SLACK_BOT_TOKEN;
const slackChannel = process.env.SLACK_CHANNEL_ID;
const app = new Slack.App({
  signingSecret: slackSigningSecret,
  token: slackBotToken,
});
console.log("Slack app initialized with signing secret and bot token");
//https://app.slack.com/block-kit-builder
const blocks = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*Farmhouse Thai Cuisine*\n:star::star::star::star: 1528 reviews\n They do have some vegan options, like the roti and curry, plus they have a ton of salad stuff and noodles can be ordered without meat!! They have something for everyone here"
    },
    "accessory": {
      "type": "image",
      "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c7ed05m9lC2EmA3Aruue7A/o.jpg",
      "alt_text": "alt text for image"
    }
  },
  {
    "type": "divider"
  },
  {
    "type": "context",
    "elements": {
      "text": {
        "type": "mrkdwn",
        "text": "*Farmhouse Thai Cuisina"
      }
    }
  }
];

await app.client.chat.postMessage({
  channel: slackChannel,
  text: 'Hello, Slack! This is a message from my Slack app.',
  blocks: blocks,
}).catch((error) => {
  console.error('Error posting message to Slack:', error);
});
// app.message('hello', async ({ message, say }) => {
//     // Respond to the message
//     await say(`Hello, <@${message.user}>!`);
//     }
// );
// app.start(3000).then(() => {
//     console.log('Slack app is running on port 3000');
// }).catch((error) => {
//     console.error('Error starting Slack app:', error);
// });
