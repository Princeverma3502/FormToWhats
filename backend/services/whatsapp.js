import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import Member from '../models/Member.js';

// 🧠 Safe import handling for CommonJS module
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

dotenv.config();

let client;

/**
 * Initialize WhatsApp Client safely
 */
export async function initWhatsApp() {
  try {
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    client.on('qr', qr => {
      console.log('\n📱 Scan the QR code below:');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => console.log('✅ WhatsApp client is ready.'));
    client.on('auth_failure', msg => console.error('❌ Authentication failure:', msg));
    client.on('disconnected', reason => console.log('⚠️ Client disconnected:', reason));

    await client.initialize();
  } catch (err) {
    console.error('Error initializing WhatsApp:', err.message);
  }
}

/**
 * Handle a new submission safely
 */
export async function handleNewSubmission({ name, phone, spreadsheetId }) {
  const inviteLink = process.env.DEFAULT_GROUP_INVITE_LINK || 'https://chat.whatsapp.com/REPLACE_ME';
  const mode = process.env.MODE || 'auto';
  const normalized = phone.replace(/[^0-9+]/g, '');
  const numberOnly = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  const chatId = numberOnly + '@c.us';
  const message = `Hi ${name}, thanks for registering for NSS! Join the group here: ${inviteLink}`;

  if (!client) {
    console.error('❗ WhatsApp client not initialized');
    return { ok: false, error: 'Client not initialized' };
  }

  try {
    if (mode === 'direct') {
      throw new Error('Direct add not configured');
    }
    await client.sendMessage(chatId, message);
    console.log(`✅ Invite sent to ${name} (${phone})`);
    return { ok: true, method: 'invited' };
  } catch (err) {
    console.error(`❌ Failed to send message to ${phone}:`, err.message);
    return { ok: false, error: err.message };
  }
}
