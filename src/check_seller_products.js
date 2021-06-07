require('dotenv').config();

const SellerAPI = require('../SharedCode/db/seller_api');
const RadarAPI = require('../SharedCode/db/radar_table_api');
const RutenAPI = require('../SharedCode/ruten_api');
const ProductsAPI = require('../SharedCode/db/products_table_api');

const { isAvailablePrice } = require('../SharedCode/utility');

const rutenAPI = new RutenAPI();
const productsAPI = new ProductsAPI();
const radarAPI = new RadarAPI();

async function main () {
  const sellerAPI = new SellerAPI();
  const sellers = await sellerAPI.getSellers();

  const newProducts = [];

  for (const seller of sellers.records) {
    // get Products
    const proResult = await rutenAPI.getSearchProducts(seller.fields.id, seller.fields.search_keyword);
    const ids = proResult.Rows.map(i => i.Id);
    // ids.push('22045888144703');
    const detailResult = await rutenAPI.getProdcutsInfo(ids);

    // fields: ProdId, ProdName, PriceRange, StockQty, SoldQty
    const tagsRegx = seller.fields.tags.split(',');

    for (const product of detailResult) {
      const valiedPrice = isAvailablePrice(Math.max(...product.PriceRange));

      if (!valiedPrice) {
        console.log(`未開放預購: ${product.ProdName}`);
        continue;
      }

      for (const tag of tagsRegx) {
        const matched = product.ProdName.match(tag);
        if (matched) {
          const item = {
            fields: {
              id: product.ProdId,
              name: product.ProdName,
              url: `https://www.ruten.com.tw/item/show?${product.ProdId}`,
              updated_at: (new Date()).getTime() / 1000,
              is_selling: false,
              type: 'ruten',
              closed_at: (new Date(product.CloseTime)).getTime() / 1000
            }
          };

          newProducts.push(item);
          break;
        }
      }
    }
  }

  for (const newItem of newProducts) {
    const exist = await productsAPI.getProducts(`{id}=${newItem.fields.id}`);
    const existItem = exist?.records[0];

    if (!existItem) {
      await _addItem(newItem);
    } else {
      await _updateItem(existItem, newItem);
    }
  }

  // console.log(newProducts);
}

async function _addItem (newItem) {
  const addedResult = await productsAPI.createProduct(newItem);
  const addedItem = addedResult.records[0];
  console.log(`create item: ${addedItem.id}`);

  const radarResult = await radarAPI.createRadar({
    fields: {
      Products: [addedItem.id],
      Charts: ['recUiDkMKUQONnHxl']
    }
  });

  console.log(`create radar: ${radarResult.records[0].id}`);
}

async function _updateItem (existItem, newItem) {
  console.log(newItem);
  existItem.fields.closed_at = newItem.fields.closed_at;
  existItem.fields.updated_at = newItem.fields.updated_at;
  delete existItem.createdTime;
  const updatedResult = await productsAPI.updateProduct(existItem);
  console.log(updatedResult);
  console.log(`update item: ${existItem.id}`);
}

main().then(() => console.log('Done')).catch((e) => console.error(e));