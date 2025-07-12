import {SlackReader} from './slack-fetcher.js';
async function main() {
  const slackReader = new SlackReader();
  slackReader.getMessages();
}

main();