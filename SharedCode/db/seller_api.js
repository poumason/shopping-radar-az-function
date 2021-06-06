const AirtableAPI = require('./airtable_api');

class SellerAPI extends AirtableAPI {
  async getSellers () {
    const response = await this.instance.get('/Seller');
    return response.data;
  }
}

module.exports = SellerAPI;
