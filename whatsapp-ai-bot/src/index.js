import 'dotenv/config';
import { connectWhatsApp } from './whatsapp.js';
import { startCleanupTask } from './utils/antiSpam.js';
import { startHistoryCleanup } from './handlers/aiHandler.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';

// =====================
// Banner startup
// =====================
console.log('\x1b[36m\x1b[1m');
console.log('╔═══════════════════════════════════════════╗');
console.log('║       🤖  WhatsApp AI Bot  🤖             ║');
console.log('║   Powered by Baileys + Groq AI            ║');
console.log('╚═══════════════════════════════════════════╝');
console.log('\x1b[0m');

logger.info(`Bot Name  : ${config.botName}`);
logger.info(`AI Model  : ${config.groqModel}`);
logger.info(`Spam CD   : ${config.spamCooldownMs}ms`);
logger.info(`Max Hist  : ${config.maxHistory} turns per user`);
console.log('');

// =====================
// Global error handlers
// =====================
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.trace(error.stack);
  // Jangan exit agar bot tetap jalan
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
  // Jangan exit agar bot tetap jalan
});

process.on('SIGINT', () => {
  logger.info('Bot dihentikan (SIGINT). Sampai jumpa! 👋');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Bot dihentikan (SIGTERM). Sampai jumpa! 👋');
  process.exit(0);
});

// =====================
// Start bot
// =====================
async function main() {
  try {
    // Mulai background tasks
    startCleanupTask();
    startHistoryCleanup();

    // Koneksi ke WhatsApp
    await connectWhatsApp();

  } catch (error) {
    logger.error(`Fatal error saat startup: ${error.message}`);
    logger.trace(error.stack);
    process.exit(1);
  }
}

main();
