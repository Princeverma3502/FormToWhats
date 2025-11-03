import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { handleNewSubmission } from './whatsapp.js';
import Member from '../models/Member.js';

dotenv.config();
let oAuth2Client;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export function oauthUrl() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret) throw new Error('Google client id/secret missing');
  oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  return oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
}

export async function oauthCallback(code) {
  const token = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(token.tokens);
  fs.writeFileSync(path.join(process.cwd(), 'backend', 'google_token.json'), JSON.stringify(token.tokens));
  return token.tokens;
}

let pollers = {};

export async function startPollingSheet(spreadsheetId, range='Form Responses!A2:C') {
  const tokenPath = path.join(process.cwd(), 'backend', 'google_token.json');
  if (!fs.existsSync(tokenPath)) throw new Error('Authorize the app first via /api/google/auth/url');
  const tokens = JSON.parse(fs.readFileSync(tokenPath));
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  oAuth2Client.setCredentials(tokens);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  let lastRowCount = 0;
  const interval = parseInt(process.env.SHEET_POLL_INTERVAL_MS || '60000', 10);
  if (pollers[spreadsheetId]) return;

  pollers[spreadsheetId] = setInterval(async ()=>{
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      const rows = res.data.values || [];
      if (rows.length > lastRowCount) {
        const newRows = rows.slice(lastRowCount);
        for (let i=0;i<newRows.length;i++) {
          const row = newRows[i];
          const name = row[1] || row[0] || 'Friend';
          const phone = row[2] || row[1] || null;
          if (phone) {
            const result = await handleNewSubmission({ name, phone, spreadsheetId });
            try{
              await Member.create({ name, phone, status: result.method === 'invited' ? 'invited' : 'added', raw: JSON.stringify(result) });
            }catch(e){ console.log('Member save error', e.message); }
            try {
              const statusCol = (row.length + 1);
              const colLetter = String.fromCharCode(64 + statusCol + 1);
              const rowNumber = lastRowCount + i + 2;
              await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Form Responses!${colLetter}${rowNumber}`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: [[ result.method === 'invited' ? 'Invited ✅' : 'Added ✅' ]] }
              });
            } catch (e) {
              console.log('Failed to update status column:', e.message);
            }
          }
        }
        lastRowCount = rows.length;
      }
    } catch (err) {
      console.error('Sheet poll error', err.message);
    }
  }, interval);
}
