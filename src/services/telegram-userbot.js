const { TelegramClient } = require('telegram');
const { StoreSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const input = require('input');
const config = require('../config');
const logger = require('../utils/logger');
const memory = require('../utils/memory');

class TelegramUserbotService {
  constructor() {
    this.client = null;
    this.groupedBuffer = new Map();
    this.processedIds = new Set();
  }

  async start(messageHandler) {
    logger.info('Starting Telegram userbot...');
    
    const session = new StoreSession('telegram_session');
    
    this.client = new TelegramClient(
      session,
      parseInt(config.telegram.apiId),
      config.telegram.apiHash,
      { connectionRetries: 5 }
    );

    await this.client.start({
      phoneNumber: async () => await input.text('Phone number: '),
      password: async () => await input.text('Password (if 2FA): '),
      phoneCode: async () => await input.text('Code from Telegram: '),
      onError: (err) => logger.error('Auth error:', err),
    });

    const channels = config.telegram.sourceChannels.map(ch => {
      return ch.startsWith('-100') ? parseInt(ch) : ch;
    });

    // САМО ЈЕДАН HANDLER - NewMessage
    this.client.addEventHandler(async (event) => {
      try {
        const message = event.message;
        
        // Провери дупликат
        const msgKey = `${message.chatId}_${message.id}`;
        if (this.processedIds.has(msgKey)) {
          return;
        }
        this.processedIds.add(msgKey);
        
        // Провери канал
        const chatId = message.chatId?.toString();
        const chatUsername = message.chat?.username;
        
        const isTracked = channels.some(ch => {
          if (typeof ch === 'number' && ch.toString() === chatId) return true;
          if (typeof ch === 'string') {
            const username = ch.startsWith('@') ? ch.substring(1) : ch;
            return username === chatUsername;
          }
          return false;
        });

        if (!isTracked) return;
        
        // Провери да ли је део албума
        const groupedId = message.groupedId?.toString();
        
        if (groupedId) {
          // ДЕО АЛБУМА - сакупљај
          if (!this.groupedBuffer.has(groupedId)) {
            this.groupedBuffer.set(groupedId, []);
            
            // Постави timeout да процесира након 1 секунде
            setTimeout(async () => {
              const messages = this.groupedBuffer.get(groupedId);
              this.groupedBuffer.delete(groupedId);
              
              if (messages && messages.length > 0) {
                // Обради као албум
                await this.handleAlbum(messages, messageHandler);
              }
            }, 1000);
          }
          
          // Додај у buffer
          this.groupedBuffer.get(groupedId).push(event);
          
        } else {
          // ПОЈЕДИНАЧНА порука
          await this.handleSingle(event, messageHandler);
        }
        
      } catch (error) {
        logger.error('Error handling message:', error.message);
      }
    }, new NewMessage({}));

    logger.info(`✅ Userbot connected! Monitoring: ${channels.join(', ')}`);
  }

  async handleAlbum(events, messageHandler) {
    // Склопи текст од свих порука у албуму
    const firstMessage = events[0].message;
    const text = firstMessage.text || firstMessage.message || '';
    
    if (!text.trim()) {
      logger.debug('Empty album text');
      return;
    }
    
    // Направи event објект као за албум
    const albumEvent = {
      messages: events.map(e => e.message),
      isAlbum: true
    };
    
    await messageHandler(albumEvent);
  }

  async handleSingle(event, messageHandler) {
    const message = event.message;
    const text = message.text || message.message || '';
    
    if (!text.trim()) {
      logger.debug('Empty message');
      return;
    }
    
    // Направи event објект за појединачну поруку
    const singleEvent = {
      message: message,
      messages: [message],
      isAlbum: false
    };
    
    await messageHandler(singleEvent);
  }

  async downloadMedia(message) {
    try {
      if (!message.media) return null;
      
      const buffer = await this.client.downloadMedia(message.media, {
        workers: 1
      });
      
      if (buffer) {
        logger.debug('Media downloaded');
        return Buffer.from(buffer);
      }
      
      return null;
    } catch (error) {
      logger.error('Download error:', error.message);
      return null;
    }
  }
}

module.exports = new TelegramUserbotService();