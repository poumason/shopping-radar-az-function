const axios = require('axios');

class AirtableAPI {
  constructor () {
    this.instance = axios.create({
      baseURL: 'https://api.airtable.com/v0/appOcxLrd5gRAFVSG',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
      }
    });
  }
}

module.exports = AirtableAPI;
