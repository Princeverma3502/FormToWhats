import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { Client, LocalAuth } from 'whatsapp-web.js';
import Member from '../models/Member.js';

dotenv.config();
let client;
export async function initWhatsApp() {
  client = new Client({ authStrategy: new LocalAuth() });
  client.on('qr', qr => { console.log('Scan QR:'); qrcode.generate(qr, {small:true}); });
  client.on('ready', ()=>console.log('WhatsApp ready'));
  client.on('auth_failure', msg=>console.error('Auth failure', msg));
  client.initialize();
}

export async function handleNewSubmission({ name, phone, spreadsheetId }) {
  const inviteLink = process.env.DEFAULT_GROUP_INVITE_LINK || 'https://chat.whatsapp.com/REPLACE_ME';
  const mode = process.env.MODE || 'auto';
  const normalized = phone.replace(/[^0-9+]/g, '');
  const numberOnly = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  const chatId = numberOnly + '@c.us';
  const message = `Hi ${name}, thanks for registering for NSS! Join the group here: ${inviteLink}`;

  try {
    if (mode === 'direct') {
      throw new Error('Direct-add not configured');
    }
    await client.sendMessage(chatId, message);
    console.log('Sent invite to', name, phone);
    return { ok:true, method:'invited' };
  } catch (err) {
    console.error('Send message failed for', phone, err.message);
    return { ok:false, method:'failed', error: err.message };
  }
}
