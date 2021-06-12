const axios = require('axios');

class AirtableAPI {
  constructor () {
    this.instance = axios.create({
      baseURL: `https://api.airtable.com/v0/${process.env.AIRTABLE_TABLE_NAME}`,
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    });
  }
}

module.exports = AirtableAPI;
