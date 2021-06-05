const axios = require('axios');

class TelegramAPI {
  static async notify (chatId, message, silently = false) {
    const botWebHook = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}`;

    try {
      const response = await axios.post(botWebHook, {
        parse_mode: 'Markdown',
        text: message,
        disable_web_page_preview: true,
        disable_notification: silently
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = TelegramAPI;
