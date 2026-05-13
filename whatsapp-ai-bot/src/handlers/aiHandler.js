import Groq from 'groq-sdk';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { sanitizeText } from '../utils/helpers.js';

const groq = new Groq({ apiKey: config.groqApiKey });

// Map: jid => array of {role, content}
const conversationHistory = new Map();

/**
 * Ambil atau buat history percakapan untuk user
 */
function getHistory(jid) {
  if (!conversationHistory.has(jid)) {
    conversationHistory.set(jid, []);
  }
  return conversationHistory.get(jid);
}

/**
 * Tambah pesan ke history dan trim jika melebihi batas
 */
function addToHistory(jid, role, content) {
  const history = getHistory(jid);
  history.push({ role, content });

  // Trim: simpan hanya N pesan terakhir (pasangan user-assistant)
  const maxMessages = config.maxHistory * 2; // x2 karena setiap exchange = 2 pesan
  if (history.length > maxMessages) {
    history.splice(0, history.length - maxMessages);
  }
}

/**
 * Generate balasan AI menggunakan Groq
 * @param {string} jid - WhatsApp JID pengirim
 * @param {string} userMessage - pesan dari user
 * @param {boolean} isGroup - apakah dari group
 * @returns {Promise<string>} balasan dari AI
 */
export async function generateAIResponse(jid, userMessage, isGroup = false) {
  try {
    const cleanMessage = sanitizeText(userMessage);
    if (!cleanMessage) return null;

    // Tambah context group jika perlu
    const contextPrefix = isGroup
      ? '[Pesan dari group chat] '
      : '';

    addToHistory(jid, 'user', contextPrefix + cleanMessage);

    const history = getHistory(jid);

    const response = await groq.chat.completions.create({
      model: config.groqModel,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt(config.botName),
        },
        ...history,
      ],
      temperature: 0.85,
      max_tokens: 500,
      top_p: 0.95,
    });

    const aiReply = response.choices?.[0]?.message?.content?.trim();

    if (!aiReply) {
      logger.warn('AI mengembalikan response kosong');
      return 'Maaf, aku lagi kurang fokus. Coba kirim lagi ya 😅';
    }

    // Simpan balasan AI ke history
    addToHistory(jid, 'assistant', aiReply);

    logger.debug(`AI response untuk ${jid}: ${aiReply.slice(0, 80)}...`);
    return aiReply;

  } catch (error) {
    logger.error(`Error Groq API: ${error.message}`);

    // Error handling spesifik
    if (error.status === 429) {
      return 'Wah, aku lagi kebanyakan chat nih. Tunggu bentar ya, terus tanya lagi 🙏';
    }
    if (error.status === 401) {
      logger.error('GROQ_API_KEY tidak valid! Cek file .env kamu.');
      return 'Ada masalah teknis di sisi aku. Coba lagi nanti ya.';
    }

    return 'Aduh, aku lagi error nih. Coba kirim lagi dalam beberapa detik 😅';
  }
}

/**
 * Reset history percakapan untuk user tertentu
 */
export function resetConversation(jid) {
  conversationHistory.delete(jid);
  logger.debug(`History percakapan direset untuk ${jid}`);
}

/**
 * Cleanup history lama untuk mencegah memory leak
 */
export function startHistoryCleanup() {
  // Cleanup setiap 2 jam: hapus history yang sudah tidak aktif (sederhana: limit total entries)
  setInterval(() => {
    const MAX_TOTAL = 500; // maks 500 user berbeda
    if (conversationHistory.size > MAX_TOTAL) {
      // Hapus yang pertama masuk (FIFO)
      const keysToDelete = [...conversationHistory.keys()].slice(
        0,
        conversationHistory.size - MAX_TOTAL
      );
      keysToDelete.forEach((k) => conversationHistory.delete(k));
      logger.info(`History cleanup: hapus ${keysToDelete.length} entry lama`);
    }
  }, 2 * 60 * 60 * 1000);
}
