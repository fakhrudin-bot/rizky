import { config } from '../config.js';

/**
 * Delay acak antara min dan max ms - biar terasa natural
 */
export function randomDelay(min = config.replyDelayMin, max = config.replyDelayMax) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ekstrak teks dari berbagai tipe pesan Baileys
 */
export function extractMessageText(message) {
  const msg = message?.message;
  if (!msg) return '';

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.listResponseMessage?.title ||
    msg.templateButtonReplyMessage?.selectedDisplayText ||
    ''
  );
}

/**
 * Cek apakah pesan berasal dari group
 */
export function isGroupMessage(jid) {
  return jid.endsWith('@g.us');
}

/**
 * Cek apakah pesan berasal dari bot sendiri
 */
export function isBotMessage(message, botJid) {
  return message.key?.fromMe === true || message.key?.participant === botJid;
}

/**
 * Cek apakah bot di-mention dalam pesan group
 */
export function isBotMentioned(message, botJid) {
  const mentionedJids =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const botNumber = botJid.split('@')[0];

  // Cek mention via @tag
  const hasMentionTag = mentionedJids.some(
    (jid) => jid.split('@')[0] === botNumber
  );

  // Cek teks "@nomor" atau "@BotName" secara eksplisit
  const text = extractMessageText(message).toLowerCase();
  const botName = config.botName.toLowerCase();
  const hasNameMention = text.includes(`@${botName}`) || text.includes(`@bot`);

  return hasMentionTag || hasNameMention;
}

/**
 * Format nomor WhatsApp jadi lebih readable
 */
export function formatPhoneNumber(jid) {
  if (!jid) return 'Unknown';
  const number = jid.split('@')[0].split(':')[0];
  return `+${number}`;
}

/**
 * Sanitize teks sebelum dikirim ke AI (hapus karakter aneh)
 */
export function sanitizeText(text) {
  return text.trim().replace(/\u0000/g, '').slice(0, 2000); // max 2000 char
}

/**
 * Sleep helper
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
