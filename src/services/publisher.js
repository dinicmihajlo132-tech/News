// src/services/publisher.js
const { TwitterApi } = require('twitter-api-v2');
const config = require('../config');
const logger = require('../utils/logger');

class PublisherService {
  constructor() {
    this.twitterClient = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret
    });
    
    this.v1Client = this.twitterClient.v1;
    this.v2Client = this.twitterClient.v2;
  }

  async publishToTwitter(text, mediaFiles = []) {
    try {
      const mediaIds = [];

      // Upload svih media fajlova
      for (const media of mediaFiles) {
        try {
          let mediaId;
          
          // Ako je buffer
          if (Buffer.isBuffer(media)) {
            mediaId = await this.v1Client.uploadMedia(media, {
              mimeType: this._getMimeType(media)
            });
          } 
          // Ako je putanja do fajla (string)
          else if (typeof media === 'string') {
            mediaId = await this.v1Client.uploadMedia(media);
          }
          
          if (mediaId) {
            mediaIds.push(mediaId);
          }
        } catch (uploadError) {
          logger.error(`Media upload greška: ${uploadError.message}`);
        }
      }

      // Očisti Markdown sintaksu za Twitter (ne podržava formatiranje)
      const cleanText = this._cleanMarkdown(text);
      
      // Pripremi tweet
      const tweetData = {
        text: cleanText.substring(0, 280)
      };

      // Dodaj media ID-jeve ako postoje
      if (mediaIds.length > 0) {
        tweetData.media = { 
          media_ids: mediaIds 
        };
      }

      // Postavi tweet
      const tweet = await this.v2Client.tweet(tweetData);
      
      logger.info(`✅ Tweet postavljen: ${tweet.data.id}`);
      return {
        success: true,
        tweetId: tweet.data.id
      };
      
    } catch (error) {
      logger.error('Twitter publish greška:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  _cleanMarkdown(text) {
    // Ukloni sve Markdown delimitere
    return text
      .replace(/\*\*/g, '')   // ukloni bold ** **
  }

  _getMimeType(buffer) {
    if (!Buffer.isBuffer(buffer)) return 'application/octet-stream';
    
    const header = buffer.toString('hex', 0, 4);
    
    if (header.startsWith('ffd8')) return 'image/jpeg';
    if (header.startsWith('8950')) return 'image/png';
    if (header === '4749') return 'image/gif';
    if (header.startsWith('0000') && buffer.toString('hex', 4, 8) === '66747970') return 'video/mp4';
    
    return 'image/jpeg';
  }
}

module.exports = new PublisherService();