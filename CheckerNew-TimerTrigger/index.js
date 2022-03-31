const { ProductsAPI, SellerAPI, RutenAPI, RadarAPI, isAvailablePrice } = require('shopping-radar-sharedcode');

const productsAPI = new ProductsAPI();
const radarAPI = new RadarAPI();

/**
 * 檢查賣家是否有新的商品、更新產品資訊
 * 1. Invoke Seller API to get all sellers
 * 1. Search products by keyword for every seller
 * 1. Check price of product is available
 * 1. Available price must binding with chats to Radar
 */

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
    context.log(`search seller: ${seller.fields.nick_name}, keywords: ${seller.fields.search_keyword}`);
    // get Products
    const detailResult = await _searchProducts(context, seller.fields.id, seller.fields.search_keyword);

    if (!detailResult) {
      break;
    }

    // fields: ProdId, ProdName, PriceRange, StockQty, SoldQty
    const tagsRegex = seller.fields.tags.split(',');
    const ignoreTags = seller.fields.ignore_tags ? seller.fields.ignore_tags.split(',') : [];

    for (const product of detailResult) {
      const validPrice = isAvailablePrice(Math.max(...product.PriceRange), ignoreTags);

      if (!validPrice) {
        context.log(`Pre-order not open: ${product.ProdName}, price: ${product.PriceRange}`);
        continue;
      }

      console.log(`${product.ProdName}, ${validPrice}`);

      for (const tag of tagsRegex) {
        // check product name is match tags
        const matched = product.ProdName.match(tag);
        if (matched) {
          const item = {
            fields: {
              id: product.ProdId,
              name: product.ProdName,
              url: `https://www.ruten.com.tw/item/show?${product.ProdId}`,
              updated_at: (new Date()).getTime() / 1000,
              type: 'ruten',
              closed_at: (new Date(product.CloseTime)).getTime() / 1000,
              price: Math.min(...product.PriceRange),
              image: `https://img.ruten.com.tw${product.Image}`,
              Seller: [seller.id]
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
