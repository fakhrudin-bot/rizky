import 'dotenv/config';

export const config = {
  // Bot identity
  botName: process.env.BOT_NAME || 'Aria',

  // Groq AI
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Anti-spam
  spamCooldownMs: parseInt(process.env.SPAM_COOLDOWN_MS || '3000', 10),

  // Reply delay (natural feel)
  replyDelayMin: parseInt(process.env.REPLY_DELAY_MIN || '1500', 10),
  replyDelayMax: parseInt(process.env.REPLY_DELAY_MAX || '4000', 10),

  // Conversation history
  maxHistory: parseInt(process.env.MAX_HISTORY || '20', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Session folder
  authFolder: 'auth_info_baileys',

  // System prompt untuk AI
  systemPrompt: (botName) => `Kamu adalah ${botName}, asisten WhatsApp yang ramah dan natural.

Aturan penting:
- Balas dalam Bahasa Indonesia yang natural dan santai, bukan kaku seperti robot
- Sesuaikan gaya bicara dengan lawan chat: kalau santai diajak santai, kalau serius jawab serius
- Untuk chat biasa, jawaban cukup pendek dan to the point (1-3 kalimat)
- Untuk pertanyaan yang butuh penjelasan panjang, boleh lebih detail
- Gunakan bahasa sehari-hari Indonesia (boleh sesekali pakai kata gaul yang wajar)
- Jangan mulai dengan "Halo!" atau salam berulang-ulang jika percakapan sudah berjalan
- Jangan sebut dirimu AI atau bot kecuali ditanya langsung
- Bersikap helpful, jujur, dan menyenangkan
- Hindari jawaban yang terlalu template atau terkesan copy-paste`,
};

// Validasi wajib
if (!config.groqApiKey) {
  console.error('\x1b[31m[CONFIG ERROR] GROQ_API_KEY belum diset di file .env!\x1b[0m');
  process.exit(1);
}
