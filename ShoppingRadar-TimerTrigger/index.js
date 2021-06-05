
const { isEmptyOrNull } = require('./lib/utility');
const RutenAPI = require('./lib/ruten_api');
const TelegramAPI = require('./lib/bot/telegram_api');

const ProductsAPI = require('./lib/db/products_table_api');

module.exports = async function (context, myTimer) {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Shopping Radar is running late!');
  }
  context.log('Shopping Radar timer trigger function ran!', timeStamp);
  await _execute();
  console.log('Shppoing Radar executed process.');
};

async function _execute () {
  /*
  - get products from airtable
  - loop to check api with type
  */

  const productsTable = new ProductsAPI();

  const rutenAPI = new RutenAPI();
  const timestamp = (new Date()).getTime() / 1000;

  const data = await productsTable.getProducts();

  if (!data || data.records.length === 0) {
    return;
  }

  for (const item of data.records) {
    console.log(item);
    // remove not used meta
    delete item.createdTime;
    const productId = item.fields.id;
    const url = item.fields.url;
    const name = item.fields.name;

    if (isEmptyOrNull(productId) || isEmptyOrNull(url)) {
      console.log(`${item.id} ${name} lost product id and url.`);
      continue;
    }

    const lastIsSelling = item.fields.is_selling ?? false;

    const result = await rutenAPI.check(productId, url);

    if (lastIsSelling === result) {
      console.log(`狀態跟上次一樣: ${item.id} ${name} `);
      continue;
    }

    if (result) {
      TelegramAPI.notify('224300083', `*立即購買*\n\n[${name}](${url})`);
    } else {
      TelegramAPI.notify('224300083', `_未開賣_\n\n[${name}](${url})`, true);
    }

    item.fields.updated_at = timestamp;
    item.fields.is_selling = result;
    const updated = await productsTable.updateProduct(item);
    console.log(updated);
  }
}
