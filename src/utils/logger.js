// src/utils/logger.js
const config = require('../config');

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor() {
    this.level = LEVELS[config.bot.logLevel] || LEVELS.info;
  }

  _log(level, emoji, ...args) {
    if (LEVELS[level] <= this.level) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${emoji}`, ...args);
    }
  }

  error(...args) { this._log('error', '❌', ...args); }
  warn(...args) { this._log('warn', '⚠️', ...args); }
  info(...args) { this._log('info', '✅', ...args); }
  debug(...args) { this._log('debug', '🔍', ...args); }
}

module.exports = new Logger();