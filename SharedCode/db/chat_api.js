const AirtableAPI = require('./airtable_api');

class ChatAPI extends AirtableAPI {
  async getChats () {
    const response = await this.instance.get('/Chats', {
      params: {
        filterByFormula: '{bot_type}=telegram'
      }
    });
    return response.data;
  }
}

module.exports = ChatAPI;
