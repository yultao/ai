import fetch from 'node-fetch';

const code = process.env.code;
const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const redirectUri = 'https://localhost:3000/oauth/callback';

const res = await fetch('https://slack.com/api/oauth.v2.access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  })
});

const data = await res.json();
console.log(data);
