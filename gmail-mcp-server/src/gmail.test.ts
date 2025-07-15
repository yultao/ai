    
import { GmailService } from './gmail.js';
    const gmail = new GmailService();
const recipient = "yultao@gmail.com";
const subject = "sub.test";
const body = "body.test";

    gmail.sendEmail(
      recipient,
      'Subject: ' + subject,
      'BODY: ' + body
    )
      .catch(console.error);