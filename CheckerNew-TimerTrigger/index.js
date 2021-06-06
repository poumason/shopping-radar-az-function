
const ProductsAPI = require('../SharedCode/db/products_table_api');
const SellerAPI = require('../SharedCode/db/seller_api');
const RutenAPI = require('../SharedCode/ruten_api');
const { isAvailablePrice } = require('../SharedCode/utility');

module.exports = async function (context, myTimer) {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Checker New is running late!');
  }

  await _execute(context);

  context.log('Checker New timer trigger function ran!', timeStamp);
};

async function _execute (context) {
  const rutenAPI = new RutenAPI();
  const productsAPI = new ProductsAPI();
  const sellerAPI = new SellerAPI();
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
      await productsAPI.createProduct(newItem);
      console.log(`create item: ${newItem.name}`);
    }
  }

  console.log(newProducts);
}
