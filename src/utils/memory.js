// src\utils\memory.js
const logger = require('./logger');
const config = require('../config');

class MemoryManager {
  constructor() {
    this.messageCache = new Map();
    this.mediaBuffers = new Map();
    this.checkInterval = null;
  }

  start() {
    // Provera memorije svakih 30 sekundi
    this.checkInterval = setInterval(() => {
      this.cleanup();
      this.logMemoryUsage();
    }, 30000);
    
    logger.info('Memory manager started');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.cleanup();
    logger.info('Memory manager stopped');
  }

  storeMedia(id, buffer) {
    this.mediaBuffers.set(id, {
      buffer,
      timestamp: Date.now()
    });
  }

  getMedia(id) {
    const data = this.mediaBuffers.get(id);
    return data ? data.buffer : null;
  }

  deleteMedia(id) {
    const deleted = this.mediaBuffers.delete(id);
    if (deleted) {
      logger.debug(`Media ${id} removed from memory`);
    }
    return deleted;
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minuta

    // Očisti stare media buffere
    for (const [id, data] of this.mediaBuffers.entries()) {
      if (now - data.timestamp > maxAge) {
        this.mediaBuffers.delete(id);
        logger.debug(`Cleaned up old media: ${id}`);
      }
    }

    // Očisti message cache
    for (const [id, timestamp] of this.messageCache.entries()) {
      if (now - timestamp > maxAge) {
        this.messageCache.delete(id);
      }
    }

    // Force garbage collection ako je memorija velika
    const usage = process.memoryUsage();
    const usedMB = usage.heapUsed / 1024 / 1024;
    
    if (usedMB > config.bot.maxMemoryMB * 0.8) {
      if (global.gc) {
        global.gc();
        logger.warn(`Forced garbage collection (${usedMB.toFixed(2)}MB used)`);
      }
    }
  }

  logMemoryUsage() {
    const usage = process.memoryUsage();
    const heapMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
    const rssMB = (usage.rss / 1024 / 1024).toFixed(2);
    
    logger.debug(`Memory: Heap ${heapMB}MB | RSS ${rssMB}MB | Media buffers: ${this.mediaBuffers.size}`);
  }

  isDuplicate(messageId) {
    if (this.messageCache.has(messageId)) {
      return true;
    }
    this.messageCache.set(messageId, Date.now());
    return false;
  }
}

module.exports = new MemoryManager();