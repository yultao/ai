import {SlackConversationParser} from "./slack-message-parser.js"


const parser = new SlackConversationParser('./conversations/dirty', './conversations/clean');
parser.processAllChannels();