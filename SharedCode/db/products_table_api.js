const AirtableAPI = require('./airtable_api');

class ProductsAPI extends AirtableAPI {
  async getProducts (filter = null) {
    // https://support.airtable.com/hc/en-us/articles/203255215-Formula-Field-Reference
    const response = await this.instance.get('/Products', {
      params: {
        filterByFormula: filter
      }
    });
    return response.data;
  }

  async createProduct (item) {
    const response = await this.instance.post('/Products', {
      records: [
        item
      ]
    });
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
