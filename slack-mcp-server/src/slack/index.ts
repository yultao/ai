import { SlackReader } from './slack-reader.js';

(async () => {
  const slackReader = new SlackReader();
  await slackReader.getMessages();
})();