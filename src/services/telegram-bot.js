// src/services/telegram-bot.js
const { Bot } = require('grammy');
const config = require('../config');
const logger = require('../utils/logger');

class TelegramBotService {
  constructor() {
    this.bot = new Bot(config.telegram.botToken);
  }

  async sendToChannel(text, mediaGroup = []) {
    try {
      if (mediaGroup.length > 0) {
        const { InputFile } = require('grammy');
        
        const media = mediaGroup.map((buf, idx) => ({
          type: this._getMediaType(buf),
          media: new InputFile(buf, `media_${idx}.jpg`),
          caption: idx === 0 ? text : undefined
        }));

        // Dodaj parse_mode za caption
        const mediaWithParsing = media.map(item => ({
          ...item,
          parse_mode: item.caption ? 'Markdown' : undefined
        }));
        
        await this.bot.api.sendMediaGroup(config.telegram.outputChatId, mediaWithParsing);
      } else {
        await this.bot.api.sendMessage(config.telegram.outputChatId, text, {
          parse_mode: 'Markdown'
        });
      }

      logger.info('📤 Message sent to Telegram channel');
      return true;
      
    } catch (error) {
      logger.error('Failed to send to Telegram:', error.message);
      return false;
    }
  }

  _getMediaType(buffer) {
    const header = buffer.toString('hex', 0, 4);
    
    if (header.startsWith('ffd8')) return 'photo';
    if (header.startsWith('0000')) return 'video';
    
    return 'photo';
  }
}

module.exports = new TelegramBotService();