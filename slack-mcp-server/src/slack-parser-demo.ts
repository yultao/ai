import {SlackConversationParser} from "./slack-parser.js"


const parser = new SlackConversationParser('./conversations/dirty', './conversations/clean');
parser.processAllChannels();