const AirtableAPI = require('./airtable_api');

class ProductsAPI extends AirtableAPI {
  async getProducts () {
    const response = await this.instance.get('/Products');
    return response.data;
  }

  async updateProduct (item) {
    const response = await this.instance.put('/Products', {
      records: [
        item
      ]
    });

    return response.data;
  }
}

module.exports = ProductsAPI;
