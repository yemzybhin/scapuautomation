import { OAuth2Client } from 'google-auth-library';
import http from 'http';

import { env } from '@/config/env-config';

const REDIRECT_URI = 'http://localhost:2000/oauth2callback';

if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) {
  console.error('Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env first');
  process.exit(1);
}

const client = new OAuth2Client(env.YOUTUBE_CLIENT_ID, env.YOUTUBE_CLIENT_SECRET, REDIRECT_URI);

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube.upload'],
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost:2000');

  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400).end('Missing code');
    return;
  }

  const { tokens } = await client.getToken(code);

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Done! You can close this tab and check the terminal.');
  server.close();

  console.log('\nAdd this to automation/.env:\n');
  console.log(
    `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token ?? '(no refresh token returned; re-run and make sure you approve consent)'}`,
  );
  process.exit(0);
});

server.listen(2000, () => {
  console.log(
    '\n1. Open this URL in a browser and sign in with the Google account that owns the YouTube channel:\n',
  );
  console.log(authUrl);
  console.log('\n2. Approve access; the refresh token will be printed here.\n');
});
