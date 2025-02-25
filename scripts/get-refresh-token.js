#!/usr/bin/env node
const http = require('http');
const url = require('url');
const open = require('open');
const { google } = require('googleapis');

// Read from .env file or environment variables
require('dotenv').config();

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Please set REACT_APP_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'http://localhost:3001/oauth2callback'
);

// Generate a url that asks permissions for Google Calendar scopes
const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent' // Force to get refresh token
});

// Create a local server to receive the OAuth2 callback
const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/oauth2callback') {
      const { code } = parsedUrl.query;
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\nAdd these values to your GitHub repository secrets:\n');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('Authentication successful! You can close this window.');
      
      setTimeout(() => process.exit(0), 1000);
    }
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('Authentication failed! Check the console for more details.');
  }
});

server.listen(3001, () => {
  console.log('\nOpening browser for Google OAuth2 authentication...');
  open(authUrl);
});
