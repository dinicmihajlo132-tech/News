// src\index.js
const telegramUserbot = require('./services/telegram-userbot');
const telegramBot = require('./services/telegram-bot');
const openai = require('./services/openai');
const publisher = require('./services/publisher');
const memory = require('./utils/memory');
const logger = require('./utils/logger');

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  memory.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  memory.stop();
  process.exit(0);
});

// Uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

async function handleMessage(event) {
  const isAlbum = event.isAlbum;
  const messages = event.messages || [event.message];
  const firstMessage = messages[0];
  const text = firstMessage.text || firstMessage.message || '';
  
  if (!text.trim()) {
    logger.debug('Empty content, skipping');
    return;
  }

  logger.info(`\n📨 New ${isAlbum ? `album (${messages.length} items)` : 'message'}: ${text.substring(0, 100)}...`);

  const result = await openai.processNews(text);
  
  if (result.isDuplicate) {
    logger.info('Duplicate detected, not publishing');
    return;
  }

  // Download media
  const mediaBuffers = [];
  
  for (const msg of messages) {
    if (msg.media) {
      const buffer = await telegramUserbot.downloadMedia(msg);
      if (buffer) {
        mediaBuffers.push(buffer);
      }
    }
  }

  if (mediaBuffers.length > 0) {
    logger.info(`📦 ${mediaBuffers.length} media files`);
  }
  
  await telegramBot.sendToChannel(result.text, mediaBuffers);
  await publisher.publishToTwitter(result.text, mediaBuffers);

  mediaBuffers.length = 0;
  logger.info('✅ Processing complete\n');
}

async function main() {
  try {
    logger.info('🚀 Starting Crypto News Bot...');
    
    // Inicijalizacija
    memory.start();
    await openai.initialize();
    
    // Pokreni userbot (sluša kanale)
    await telegramUserbot.start(handleMessage);
    
    logger.info('✅ Bot is running! Press Ctrl+C to stop.');
    
  } catch (error) {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

main();