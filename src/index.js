require('dotenv').config();

const ProductsAPI = require('../SharedCode/db/products_table_api');
const SellerAPI = require('../SharedCode/db/seller_api');
const RutenAPI = require('../SharedCode/ruten_api');
const RadarAPI = require('../SharedCode/db/radar_table_api');
const ChatAPI = require('../SharedCode/db/chat_api');
const { isAvailablePrice } = require('../SharedCode/utility');

async function main () {
  const rutenAPI = new RutenAPI();
  const productsAPI = new ProductsAPI();
  const sellerAPI = new SellerAPI();
  const radarAPI = new RadarAPI();
  const chatAPI = new ChatAPI();
  const sellers = await sellerAPI.getSellers();

  const newProducts = [];

  for (const seller of sellers.records) {
    // get Products
    const proResult = await rutenAPI.getSearchProducts(seller.fields.id, seller.fields.search_keyword);
    const ids = proResult.Rows.map(i => i.Id);
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
              type: 'ruten'
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

    if (!exist || exist.records.length === 0) {
      // add new item
      const addedResult = await productsAPI.createProduct(newItem);

      if (!addedResult || addedResult.records.length === 0) {
        // add item failed.
        continue;
      }

      const addedItem = addedResult.records[0];
      const chatsResult = await chatAPI.getChats();

      for (const chat of chatsResult.records) {
        const radarResult = await radarAPI.createRadar({
          fields: {
            Products: [addedItem.id],
            Charts: [chat.id]
          }
        });
        console.log(radarResult);
      }

      console.log(`create item: ${newItem.name}`);
    }
  }

  console.log(newProducts);
}

main().then(() => console.log('Done')).catch((e) => console.error(e));
