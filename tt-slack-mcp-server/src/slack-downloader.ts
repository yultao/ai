import fs from 'fs';

type SlackMessage = {
  ts: string;
  thread_ts?: string;
  text: string;
  [key: string]: any;
  replies: SlackMessage[]
};

export class SlackDownloader {

  constructor() { }
  /**
   * Remove JSON content inside cached_latest_updates form-data
   */
  stripCachedLatestUpdatesBody(body: string): string {
    return body.replace(
      /(name=\\"cached_latest_updates\\"\\r\\n\\r\\n)\{[^}]*\}/,
      '$1{}'
    );
  }

  deduplicateByTS(messages: SlackMessage[]): SlackMessage[] {
    const seen = new Set<string>();
    return messages.filter((msg) => {
      if (seen.has(msg.ts)) {
        return false;
      }
      seen.add(msg.ts);
      return true;
    });
  }

  /**
   * Parse and execute fetch calls from the requests.txt file
   */
  async runRequestsFromFile(filePath: string) {
    const raw = await fs.promises.readFile(filePath, 'utf-8');

    // Match each fetch(...) block
    const fetchBlocks = raw.match(/fetch\([^]*?\}\)/g);
    if (!fetchBlocks) {
      console.error('No fetch blocks found.');
      return;
    }

    //step 1: read all raw messages
    const allMessages: SlackMessage[] = [];
    // const msgs =[];
    for (const fetchCall of fetchBlocks) {
      try {
        // Safely rewrite body part if cached_latest_updates exists
        const bodyMatch = fetchCall.match(/"body":\s*?"([^]*?)",\s*"method":/);
        if (bodyMatch) {
          const originalBody = bodyMatch[1];
          const cleanedBody = this.stripCachedLatestUpdatesBody(originalBody);

          // Replace in the fetch string
          const cleanedFetch = fetchCall.replace(originalBody, cleanedBody);
          // console.log('Executing request... ' + cleanedFetch);

          const res = await eval(`(async () => ${cleanedFetch})()`);
          const json = await res.json();
          console.log('✅ Result:', json.ok ? 'OK' : json.error);


          allMessages.push(...json.messages);
        } else {
          console.warn('Skipping fetch: no body found.');
        }
      } catch (err) {
        console.error('❌ Failed request:', err);
      }
    }

    //step 2: clean
    for (const msg of allMessages) {
      delete msg.blocks;
      delete msg.bot_profile;
    }

    //step 3: uniqueMessages
    const uniqueMessages = this.deduplicateByTS(allMessages);

    const messageMap: Record<string, SlackMessage> = {};
    for (const msg of uniqueMessages) {
      if (msg.ts) {
        messageMap[msg.ts] = msg;
      }
    }

    const messagesWithReplies: SlackMessage[] = [];
    for (const msg of uniqueMessages) {
      if (msg.thread_ts && msg.thread_ts!=msg.ts) {//replies
        const pa = messageMap[msg.thread_ts];

        if(!pa.replies){
          pa.replies = [];
        };
        
        console.log("push rep "+msg.ts+", "+msg.thread_ts+": "+pa.ts+", "+pa.thread_ts+", "+pa.replies)


        pa.replies.push(msg);
      } else {
        console.log("push top "+msg.ts+", "+msg.thread_ts)
        messagesWithReplies.push(msg);
      }
    }

    //step 4: sortedMessages
    const sortedMessages = messagesWithReplies.sort((a, b) => Number(a.ts) - Number(b.ts));
    for (const msg of messagesWithReplies) {
      if(msg.replies){
        msg.replies.sort((a, b) => Number(a.ts) - Number(b.ts))
      }
    }



    await fs.promises.writeFile(filePath + ".json", JSON.stringify(sortedMessages, null, 2), 'utf-8');
  }


}

const down = new SlackDownloader();
await down.runRequestsFromFile("requests.txt");