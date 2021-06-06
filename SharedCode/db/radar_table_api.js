const AirtableAPI = require('./airtable_api');

class RadarTableAPI extends AirtableAPI {
  async getRadars () {
    const response = await this.instance.get('/Radar');
    return response.data;
  }

  async createRadar (item) {
    const response = await this.instance.post('/Radar', {
      records: [
        item
      ]
    });
    return response.data;
  }
}

module.exports = RadarTableAPI;
