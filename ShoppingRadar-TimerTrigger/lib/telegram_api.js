const axios = require('axios');

class TelegramAPI {
  static async notify (chatId, message) {
    const botWebHook = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}`;

    try {
      console.log((await axios.post(botWebHook, {
        parse_mode: 'Markdown',
        text: message
      })).data);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = TelegramAPI;
