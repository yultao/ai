// getSlackToken.js
import express from 'express';
import fetch from 'node-fetch';
import open from 'open';

const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const redirectUri = 'https://3d2f-45-44-189-156.ngrok-free.app/oauth/callback';
const userScopes = [
  'channels:read',
  'channels:history',
  'groups:read',
  'groups:history',
  'im:history',
  'mpim:history',
  'users:read',
  'chat:write',
].join(',');

const app = express();

app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    console.log('🔑 Token Response:\n', data);

    if (data.authed_user?.access_token) {
      res.send(`<pre>Success! User token:\n\n${data.authed_user.access_token}</pre>`);
    } else {
      res.send(`<pre>Something went wrong:\n\n${JSON.stringify(data, null, 2)}</pre>`);
    }
  } catch (err) {
    console.error('Error exchanging code for token:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Start local server
app.listen(3000, () => {
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${userScopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log(`🚀 Server running at http://localhost:3000`);
  console.log(`🌐 Opening browser to Slack auth URL:\n${authUrl}`);
  open(authUrl);
});
