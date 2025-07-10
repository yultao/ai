import {SlackReader} from './slack-reader.js';
async function main() {
  const slackReader = new SlackReader();
  slackReader.getMessages();
}

main();