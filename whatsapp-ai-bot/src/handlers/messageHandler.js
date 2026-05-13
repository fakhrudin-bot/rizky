import {
  extractMessageText,
  isGroupMessage,
  isBotMessage,
  isBotMentioned,
  formatPhoneNumber,
  randomDelay,
} from '../utils/helpers.js';
import { canReply, recordReply } from '../utils/antiSpam.js';
import { generateAIResponse } from './aiHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Handler utama untuk semua pesan masuk
 * @param {object} sock - Baileys socket instance
 * @param {object} message - pesan WhatsApp
 */
export async function handleMessage(sock, message) {
  try {
    // Abaikan pesan kosong atau status update
    if (!message.message) return;
    if (message.key?.remoteJid === 'status@broadcast') return;

    const jid = message.key.remoteJid;
    const isGroup = isGroupMessage(jid);
    const senderJid = isGroup
      ? (message.key.participant || message.key.remoteJid)
      : jid;

    // Ambil JID bot sendiri
    const botJid = sock.user?.id || '';

    // Filter: jangan balas pesan bot sendiri
    if (isBotMessage(message, botJid)) return;

    // Cek tipe pesan yang bisa diproses
    const supportedTypes = [
      'conversation',
      'extendedTextMessage',
      'imageMessage',
      'videoMessage',
      'documentMessage',
      'buttonsResponseMessage',
      'listResponseMessage',
      'templateButtonReplyMessage',
    ];

    const messageType = Object.keys(message.message)[0];
    if (!supportedTypes.includes(messageType)) {
      logger.debug(`Skip tipe pesan tidak didukung: ${messageType}`);
      return;
    }

    const text = extractMessageText(message);
    if (!text || text.trim().length === 0) return;

    const senderPhone = formatPhoneNumber(senderJid);

    // === LOGIC ROUTING ===

    if (isGroup) {
      // Group: hanya balas jika bot di-mention
      const mentioned = isBotMentioned(message, botJid);
      if (!mentioned) {
        logger.debug(`Group message diabaikan (tidak di-mention): ${jid}`);
        return;
      }

      logger.message(`${senderPhone} di ${jid}`, text, true);
      await processAndReply(sock, message, jid, senderPhone, text, true);

    } else {
      // Private chat: selalu balas
      logger.message(senderPhone, text, false);
      await processAndReply(sock, message, jid, senderPhone, text, false);
    }

  } catch (error) {
    logger.error(`handleMessage error: ${error.message}`);
    logger.trace(error.stack);
  }
}

/**
 * Proses pesan dan kirim balasan
 */
async function processAndReply(sock, message, jid, senderPhone, text, isGroup) {
  // Cek anti-spam
  const spamKey = isGroup
    ? `${jid}:${message.key.participant || jid}`
    : jid;

  if (!canReply(spamKey)) {
    logger.debug(`Anti-spam: skip balasan untuk ${senderPhone}`);
    return;
  }

  try {
    // Tampilkan typing indicator
    await sock.sendPresenceUpdate('composing', jid);

    // Generate AI response
    const aiReply = await generateAIResponse(spamKey, text, isGroup);
    if (!aiReply) return;

    // Delay natural sebelum kirim (sesuai panjang jawaban)
    const typingDuration = Math.min(
      aiReply.length * 30, // ~30ms per karakter
      4000                  // maks 4 detik
    );
    await randomDelay(
      Math.max(1000, typingDuration * 0.5),
      Math.max(2000, typingDuration)
    );

    // Stop typing indicator
    await sock.sendPresenceUpdate('paused', jid);

    // Kirim balasan
    // Jika dari group, quote pesan aslinya
    const replyOptions = isGroup
      ? { quoted: message }
      : {};

    await sock.sendMessage(jid, { text: aiReply }, replyOptions);

    // Catat ke anti-spam
    recordReply(spamKey);

    logger.reply(senderPhone, aiReply);

  } catch (error) {
    logger.error(`processAndReply error: ${error.message}`);

    // Coba kirim pesan error fallback
    try {
      await sock.sendPresenceUpdate('paused', jid);
      await sock.sendMessage(jid, {
        text: 'Maaf, ada gangguan teknis. Coba lagi bentar ya 🙏',
      });
    } catch {
      // Silent fail jika bahkan error message tidak bisa dikirim
    }
  }
}
