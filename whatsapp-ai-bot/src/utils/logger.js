import { config } from '../config.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const levels = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };
const currentLevel = levels[config.logLevel] ?? levels.info;

function timestamp() {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatPrefix(level, color, icon) {
  return `${colors.gray}[${timestamp()}]${colors.reset} ${color}${colors.bright}${icon} ${level.toUpperCase().padEnd(5)}${colors.reset}`;
}

export const logger = {
  trace: (msg, ...args) => {
    if (currentLevel <= levels.trace)
      console.log(`${formatPrefix('trace', colors.gray, '🔍')} ${colors.gray}${msg}${colors.reset}`, ...args);
  },

  debug: (msg, ...args) => {
    if (currentLevel <= levels.debug)
      console.log(`${formatPrefix('debug', colors.cyan, '🐛')} ${colors.cyan}${msg}${colors.reset}`, ...args);
  },

  info: (msg, ...args) => {
    if (currentLevel <= levels.info)
      console.log(`${formatPrefix('info', colors.green, '✅')} ${msg}`, ...args);
  },

  warn: (msg, ...args) => {
    if (currentLevel <= levels.warn)
      console.warn(`${formatPrefix('warn', colors.yellow, '⚠️ ')} ${colors.yellow}${msg}${colors.reset}`, ...args);
  },

  error: (msg, ...args) => {
    if (currentLevel <= levels.error)
      console.error(`${formatPrefix('error', colors.red, '❌')} ${colors.red}${msg}${colors.reset}`, ...args);
  },

  message: (from, text, isGroup) => {
    const source = isGroup
      ? `${colors.magenta}[GROUP]${colors.reset}`
      : `${colors.blue}[PRIVATE]${colors.reset}`;
    const shortText = text.length > 60 ? text.slice(0, 60) + '…' : text;
    console.log(
      `${formatPrefix('msg', colors.blue, '💬')} ${source} ${colors.bright}${from}${colors.reset}: ${shortText}`
    );
  },

  reply: (to, text) => {
    const shortText = text.length > 60 ? text.slice(0, 60) + '…' : text;
    console.log(
      `${formatPrefix('reply', colors.green, '🤖')} ${colors.bright}→ ${to}${colors.reset}: ${shortText}`
    );
  },

  bot: (msg) => {
    console.log(
      `\n${colors.cyan}${colors.bright}${'─'.repeat(50)}${colors.reset}`
    );
    console.log(
      `${colors.cyan}${colors.bright}  🤖 ${msg}${colors.reset}`
    );
    console.log(
      `${colors.cyan}${colors.bright}${'─'.repeat(50)}${colors.reset}\n`
    );
  },
};
