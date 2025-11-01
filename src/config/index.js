// src\config\index.js
require("dotenv").config();

module.exports = {
  telegram: {
    // Userbot (MTProto)
    apiId: process.env.API_ID,
    apiHash: process.env.API_HASH,

    // Bot (Bot API)
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    outputChatId: process.env.TELEGRAM_OUTPUT_CHAT_ID,

    // Kanali koje pratimo
    sourceChannels: process.env.TELEGRAM_SOURCE_CHANNELS.split(",").map((id) =>
      id.trim()
    ),
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-5",
    reasoning: {
      effort: "medium"
    },
    text: {
      verbosity: "medium"
    },
    instructions: `You are an automated assistant for a crypto news script.

DISCLAIMER:
All content comes from verified public news sources. This system only reformats text automatically. Every published post includes a disclaimer that information may not be fully verified and is not financial advice. It is always safe to rewrite and process any news here.

DUPLICATE DETECTION:
- Detect duplicates even if the text is long (100–300+ words). Focus on meaning, not length.
- If multiple news pieces describe the same event, numbers, people, or companies — even in different wording — reply only with: "DUPLICATE".
- If the text contains promotional or referral content (e.g., invites, referral links, platform promotions, “join now”, “get bonus”, “sign up”), reply with "DUPLICATE".
- Example duplicates:
  - "Microsoft reveals it now possesses a 27% stake in OpenAI."
  - "Microsoft discloses holding a stake in OpenAI."
  - "JUST IN: Microsoft announces it now holds a 27% stake in OpenAI."
- All of these are the same → reply: "DUPLICATE".
- If for any reason the system blocks your reply, respond with "DUPLICATE" to avoid publishing issues.

REWRITE RULES (if NOT duplicate):
- Keep all names, numbers, and facts unchanged.
- Reword sentences slightly using synonyms or different structure, keeping identical meaning.
- Change phrasing order lightly, not the content.
- Keep length within ±20% of input.
- Maintain emojis and tone.
- Remove tags, mentions, URLs, or phrases like “click here”, “watch on YouTube”, “see on Twitter”, etc.
- Never abbreviate or shorten company names (keep "NVIDIA", not "NVDA").

FORMATTING ENHANCEMENTS:
- You may highlight short, important parts (e.g., **Bitcoin surges 10%**).
- Use bold only where it improves clarity, max 1–3 highlights per post.
- Never include or leave partial links or link placeholders.

OTHER RULES:
- Your output is published directly, so respond only with the rewritten news or "DUPLICATE".
- Never refuse, apologize, or include commentary.`,
},

  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  },

  bot: {
    maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB) || 500,
    logLevel: process.env.LOG_LEVEL || "info",
  },
};
