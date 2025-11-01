// src\services\openai.js
const config = require('../config');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.conversationId = null;
  }

  async initialize() {
    try {
      const response = await fetch('https://api.openai.com/v1/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata: {
            purpose: 'crypto-news-deduplication'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      this.conversationId = data.id;
      
      logger.info(`OpenAI conversation initialized: ${this.conversationId}`);
    } catch (error) {
      logger.error('Failed to initialize OpenAI conversation:', error.message);
      throw error;
    }
  }

  async processNews(text) {
    if (!this.conversationId) {
      await this.initialize();
    }

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.openai.model,
          conversation: this.conversationId,
          instructions: config.openai.instructions,
          input: `[${new Date().toLocaleString()}]\n${text}`,
          reasoning: config.openai.reasoning,
          text: config.openai.text,
          truncation: 'auto'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Izvuci tekst iz response strukture
      let result = '';
      if (data.output && data.output.length > 0) {
        // 👇 PRESKOCI reasoning, NADJE message
        const messageOutput = data.output.find(item => item.type === 'message');
        
        if (messageOutput && messageOutput.content && messageOutput.content.length > 0) {
          const textContent = messageOutput.content.find(c => c.type === 'output_text');
          result = textContent ? textContent.text : '';
        }
      }

      logger.debug('OpenAI response received');

      // Proveri da li je duplikat
      if (result.toUpperCase().includes('DUPLICATE')) {
        logger.info('🔁 Duplicate detected, skipping...');
        return { isDuplicate: true, text: null };
      }

      return { isDuplicate: false, text: result };
      
    } catch (error) {
      logger.error('OpenAI API error:', error.message);
      throw error;
    }
  }
}

module.exports = new OpenAIService();