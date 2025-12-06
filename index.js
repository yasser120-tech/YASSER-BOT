require('dotenv').config();
const makeWASocket = require('@adiwajshing/baileys').default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const mime = require('mime-types');

const SESSION_DIR = process.env.SESSION_FILE || 'yasser-session';
const PREFIX = '.';
const OWNER = process.env.OWNER_NUMBER || '';

(async () => {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log('Using WA version', version, 'isLatest?', isLatest);

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    version
  });

  // Handle connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('--- QR ---');
      qrcode.generate(qr, { small: true });
      console.log('Scan the QR with your WhatsApp (Linked Devices -> Link a Device)');
    }
    if (connection === 'close') {
      const reason = (lastDisconnect?.error)?.output?.statusCode || lastDisconnect?.error?.message;
      console.log('connection closed:', reason);
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        console.log('Reconnecting...');
      } else {
        console.log('Logged out — delete session folder to re-authenticate');
      }
    } else if (connection === 'open') {
      console.log('Connected ✅');
    }
  });

  // Save session
  sock.ev.on('creds.update', saveCreds);

  // Express status server
  const express = require('express');
  const app = express();
  const PORT = process.env.PORT || 3000;
  app.get('/', (req, res) => res.send('YASSER TECH BOT is running ✅'));
  app.listen(PORT, () => console.log(`Status server listening on ${PORT}`));

  // Message handler
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg) return;
      if (msg.key && msg.key.remoteJid === 'status@broadcast') return;
      const fromMe = msg.key.fromMe;
      if (fromMe) return;

      const sender = msg.key.participant || msg.key.remoteJid;
      const remoteJid = msg.key.remoteJid;
      const messageType = Object.keys(msg.message || {})[0];

      const text = (() => {
        try {
          if (!msg.message) return '';
          if (msg.message.conversation) return msg.message.conversation;
          if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) return msg.message.extendedTextMessage.text;
          if (msg.message.imageMessage && msg.message.imageMessage.caption) return msg.message.imageMessage.caption;
          if (msg.message.videoMessage && msg.message.videoMessage.caption) return msg.message.videoMessage.caption;
          return '';
        } catch (e) { return ''; }
      })();

      // Auto-reply greetings
      if (text && /hi|hello|habari|salaam/i.test(text) && !text.startsWith(PREFIX)) {
        await sock.sendMessage(remoteJid, { text: `Mambo! niko online. Tumia ${PREFIX}help kwa commands.` }, { quoted: msg });
        return;
      }

      // Commands
      if (!text.startsWith(PREFIX)) return;
      const body = text.slice(PREFIX.length).trim();
      const args = body.split(/\s+/);
      const command = args.shift().toLowerCase();

      if (command === 'help') {
        const helpMsg = [
          'YASSER TECH BOT - Commands:',
          `${PREFIX}help - show this`,
          `${PREFIX}ping - check`,
          `${PREFIX}say <text> - bot repeats`,
          `${PREFIX}sticker - reply to image/video to make sticker`,
          `${PREFIX}yt <url> - download youtube (video)`,
          `${PREFIX}yta <url> - download youtube audio (mp3)`,
          `${PREFIX}tagall - tag all group members`,
          `${PREFIX}kick <@number> - remove member`
        ].join('\n');
        await sock.sendMessage(remoteJid, { text: helpMsg }, { quoted: msg });
        return;
      }

      if (command === 'ping') {
        await sock.sendMessage(remoteJid, { text: 'Pong! 🏓' }, { quoted: msg });
        return;
      }

      if (command === 'say') {
        const sayText = args.join(' ');
        if (!sayText) return await sock.sendMessage(remoteJid, { text: 'Tumia: .say Hello' }, { quoted: msg });
        await sock.sendMessage(remoteJid, { text: sayText });
        return;
      }

    } catch (err) {
      console.error('messages.upsert handler error', err);
    }
  });

})();
