import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { handleMessage } from './handlers/messageHandler.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

// Reconnect state
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_BASE = 3000; // 3 detik

/**
 * Buat koneksi WhatsApp
 */
export async function connectWhatsApp() {
  logger.info('Memulai koneksi WhatsApp...');

  // Ambil versi Baileys terbaru
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info(`Baileys version: ${version.join('.')} | Latest: ${isLatest}`);

  // Load/buat auth state
  const { state, saveCreds } = await useMultiFileAuthState(config.authFolder);

  // Buat pino logger yang quiet untuk Baileys (tidak polusi terminal)
  const baileysLogger = pino({
    level: 'silent',
  });

  // Buat socket
  const sock = makeWASocket({
    version,
    logger: baileysLogger,
    printQRInTerminal: false, // kita handle sendiri biar lebih cantik
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    browser: ['WhatsApp AI Bot', 'Chrome', '120.0.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    getMessage: async () => ({ conversation: '' }), // prevent retry errors
  });

  // =====================
  // EVENT: Connection Update
  // =====================
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Tampilkan QR code di terminal
    if (qr) {
      console.clear();
      logger.bot('Scan QR Code berikut dengan WhatsApp kamu:');
      qrcode.generate(qr, { small: true });
      console.log('\n\x1b[33mQR Code akan expire dalam 60 detik. Scan cepat!\x1b[0m\n');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode
        : null;

      const reason = DisconnectReason[statusCode] || `Status ${statusCode}`;
      logger.warn(`Koneksi terputus: ${reason}`);

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = RECONNECT_DELAY_BASE * Math.min(reconnectAttempts, 5);
          logger.info(`Mencoba reconnect ke-${reconnectAttempts} dalam ${delay / 1000}s...`);
          setTimeout(connectWhatsApp, delay);
        } else {
          logger.error(`Gagal reconnect setelah ${MAX_RECONNECT_ATTEMPTS} percobaan. Bot berhenti.`);
          process.exit(1);
        }
      } else {
        logger.warn('Bot di-logout. Hapus folder auth_info_baileys lalu jalankan ulang.');
        process.exit(0);
      }
    }

    if (connection === 'open') {
      reconnectAttempts = 0; // reset counter setelah berhasil
      const botNumber = sock.user?.id?.split(':')[0] || 'Unknown';

      logger.bot(`Bot aktif! Nomor: +${botNumber} | Model: ${config.groqModel}`);
      logger.info('Bot siap menerima pesan. Ctrl+C untuk berhenti.');
    }

    if (connection === 'connecting') {
      logger.info('Menghubungkan ke WhatsApp...');
    }
  });

  // =====================
  // EVENT: Credentials Updated
  // =====================
  sock.ev.on('creds.update', saveCreds);

  // =====================
  // EVENT: Messages Upsert
  // =====================
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Hanya proses pesan baru yang masuk
    if (type !== 'notify') return;

    for (const message of messages) {
      // Skip broadcast/status
      if (isJidBroadcast(message.key?.remoteJid || '')) continue;

      // Skip pesan lama (lebih dari 30 detik)
      const msgTimestamp = message.messageTimestamp
        ? Number(message.messageTimestamp) * 1000
        : 0;
      if (Date.now() - msgTimestamp > 30000) {
        logger.debug('Skip pesan lama');
        continue;
      }

      // Proses pesan
      await handleMessage(sock, message);
    }
  });

  // =====================
  // EVENT: Error handling
  // =====================
  sock.ev.on('error', (error) => {
    logger.error(`Socket error: ${error.message}`);
  });

  return sock;
}
