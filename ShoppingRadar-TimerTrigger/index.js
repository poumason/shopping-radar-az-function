const { isEmptyOrNull, RutenAPI, TelegramAPI, ProductsAPI } = require('shopping-radar-sharedcode');

/**
 * 檢查產品是否開賣或停止販售
 * 1. Invoke Product API to get all productions
 * 1. Check price available of every product
 * 1. When price be changed, the must send message to notify radar
 */

module.exports = async function (context, myTimer) {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Shopping Radar is running late!');
  }
  context.log('Shopping Radar timer trigger function ran!', timeStamp);

  await _execute(context);

  context.log('Shppoing Radar executed process.');
};

async function _execute (context) {
  const productsTable = new ProductsAPI();
  const rutenAPI = new RutenAPI();
  const timestamp = (new Date()).getTime() / 1000;

  const data = await productsTable.getProducts();

  if (!data || data.length === 0) {
    return;
  }

  for (const item of data) {
    context.log(item);
    // remove not used meta
    delete item.createdTime;
    const productId = item.fields.id;
    const url = item.fields.url;
    const name = item.fields.name;
    const ignoreTags = item.fields.ignore_tags ?? [];

    if (isEmptyOrNull(productId) || isEmptyOrNull(url)) {
      context.log(`${item.id} ${name} lost product id and url.`);
      continue;
    }

    const lastIsSelling = item.fields.is_selling ?? false;

    try {
      const result = await rutenAPI.validateProduct(productId, ignoreTags);

      if (lastIsSelling === result) {
        context.log(`the product: ${item.id} ${name} is the same state with previous.`);
        continue;
      }

      if (result) {
        TelegramAPI.notify('224300083', `*立即購買* NT$ ${item.fields.price}\n\n[${name}](${url})`);
      } else {
        TelegramAPI.notify('224300083', `_已結束_\n\n[${name}](${url})`, true);
      }

      item.fields.updated_at = timestamp;
      item.fields.is_selling = result;
      delete item.fields.ignore_tags;

      const updated = await productsTable.updateProduct({
        id: item.id,
        fields: item.fields
      });

      context.log(updated);
    } catch (e) {
      context.log(e);
    }
  }
}
