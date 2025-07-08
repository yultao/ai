import SlackConversationParser from "./slack-message-parser.js"


const parser = new SlackConversationParser('./conversations', './output');
parser.processAllChannels();