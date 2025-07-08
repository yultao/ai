npx rimraf build
npx tsc

channel name: sending msg,  The API resolves the name #general to its channel ID internally.
channel id: read history, conversations.history doesn't resolve names.

```
const result = await client.conversations.list();
const channel = result.channels.find(c => c.name === 'general');
console.log(channel.id); // → C12345678
```