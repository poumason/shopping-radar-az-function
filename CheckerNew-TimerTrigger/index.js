const { ProductsAPI, SellerAPI, RutenAPI, RadarAPI, isAvailablePrice } = require('shopping-radar-sharedcode');

const productsAPI = new ProductsAPI();
const radarAPI = new RadarAPI();

module.exports = async function (context, myTimer) {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Checker New is running late!');
  }

  await _execute(context);

  context.log('Checker New timer trigger function ran!', timeStamp);
};

async function _execute (context) {
  const sellerAPI = new SellerAPI();
  const sellers = await sellerAPI.getSellers();

  const newProducts = [];

  for (const seller of sellers) {
    // get Products
    const detailResult = await _searchProducts(context, seller.fields.id, seller.fields.search_keyword);

    if (!detailResult) {
      break;
    }

    // fields: ProdId, ProdName, PriceRange, StockQty, SoldQty
    const tagsRegex = seller.fields.tags.split(',');

    for (const product of detailResult) {
      const validPrice = isAvailablePrice(Math.max(...product.PriceRange));

      if (!validPrice) {
        context.log(`未開放預購: ${product.ProdName}`);
        continue;
      }

      for (const tag of tagsRegex) {
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
              closed_at: (new Date(product.CloseTime)).getTime() / 1000,
              price: Math.min(...product.PriceRange),
              image: `https://img.ruten.com.tw${product.Image}`
            }
          };

          newProducts.push(item);
          break;
        }
      }
    }
  }

  context.log(newProducts);

  for (const newItem of newProducts) {
    const exist = await productsAPI.getProducts({
      filterByFormula: `id = "${newItem.fields.id}"`
    });

    if (!exist || exist.length === 0) {
      await _addItem(context, newItem);
    } else {
      const existItem = exist[0];
      await _updateItem(context, existItem, newItem);
    }
  }
}

async function _searchProducts (context, id, keywords) {
  context.log(`search seller: ${id}, keywords: ${keywords}`);
  const rutenAPI = new RutenAPI();
  try {
    const proResult = await rutenAPI.getSearchProducts(id, keywords);
    const ids = proResult.Rows.map(i => i.Id);
    const detailResult = await rutenAPI.getProductsInfo(ids);
    return detailResult;
  } catch (e) {
    context.log(e);
    return null;
  }
}

async function _addItem (context, newItem) {
  console.log(newItem);
  const addedResult = await productsAPI.createProduct(newItem);
  const addedItem = addedResult[0];
  context.log(`create item: ${addedItem.id}`);

  const radarResult = await radarAPI.createRadar({
    fields: {
      Products: [addedItem.id],
      Chats: ['recUiDkMKUQONnHxl']
    }
  });

  context.log(`create radar: ${radarResult[0].id}`);
}

async function _updateItem (context, existItem, newItem) {
  existItem.fields.closed_at = newItem.fields.closed_at;
  existItem.fields.updated_at = newItem.fields.updated_at;
  existItem.fields.price = newItem.fields.price;
  existItem.fields.image = newItem.fields.image;
  delete existItem.createdTime;
  const updatedResult = await productsAPI.updateProduct({
    id: existItem.id,
    fields: existItem.fields
  });
  context.log(updatedResult);
  context.log(`update item: ${existItem.id}`);
}
