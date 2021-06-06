const axios = require('axios');

class LINEAPI {
  static async notifyByLINE (chatId, message) {
    const instance = axios.create({
      headers: {
        Authorization: `Bearer ${process.env.LINE_BOT_CHANNEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    try {
      console.log((await instance.post('https://api.line.me/v2/bot/message/push', message)).data);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = LINEAPI;
