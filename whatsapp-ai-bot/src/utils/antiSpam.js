import { config } from '../config.js';
import { logger } from './logger.js';

// Map: jid => timestamp terakhir dibalas
const lastReplyMap = new Map();

// Map: jid => jumlah pesan berturut-turut dalam window
const messageCountMap = new Map();

const BURST_LIMIT = 5;      // maks 5 pesan dalam window
const BURST_WINDOW_MS = 10000; // window 10 detik

/**
 * Cek apakah user boleh dibalas (belum kena cooldown / spam)
 * @returns {boolean} true = boleh balas, false = skip
 */
export function canReply(jid) {
  const now = Date.now();

  // Cek basic cooldown
  const lastReply = lastReplyMap.get(jid) || 0;
  if (now - lastReply < config.spamCooldownMs) {
    logger.debug(`Anti-spam cooldown aktif untuk ${jid}`);
    return false;
  }

  // Cek burst (terlalu banyak pesan cepat)
  const countData = messageCountMap.get(jid) || { count: 0, windowStart: now };

  if (now - countData.windowStart > BURST_WINDOW_MS) {
    // Reset window
    messageCountMap.set(jid, { count: 1, windowStart: now });
  } else {
    countData.count += 1;
    messageCountMap.set(jid, countData);

    if (countData.count > BURST_LIMIT) {
      logger.warn(`Burst spam terdeteksi dari ${jid} (${countData.count} pesan)`);
      return false;
    }
  }

  return true;
}

/**
 * Catat bahwa bot sudah membalas user ini
 */
export function recordReply(jid) {
  lastReplyMap.set(jid, Date.now());
}

/**
 * Reset data spam untuk user tertentu (opsional)
 */
export function resetUser(jid) {
  lastReplyMap.delete(jid);
  messageCountMap.delete(jid);
}

/**
 * Cleanup berkala untuk mencegah memory leak
 * Hapus entry yang sudah lebih dari 1 jam
 */
export function startCleanupTask() {
  setInterval(() => {
    const now = Date.now();
    const ONE_HOUR = 3600000;

    for (const [jid, ts] of lastReplyMap.entries()) {
      if (now - ts > ONE_HOUR) lastReplyMap.delete(jid);
    }
    for (const [jid, data] of messageCountMap.entries()) {
      if (now - data.windowStart > ONE_HOUR) messageCountMap.delete(jid);
    }

    logger.debug(`Anti-spam cleanup: ${lastReplyMap.size} entry aktif`);
  }, 30 * 60 * 1000); // setiap 30 menit
}
