require('dotenv').config();

const ProductsAPI = require('../SharedCode/db/products_table_api');
const RutenAPI = require('../SharedCode/ruten_api');
const { isEmptyOrNull } = require('../SharedCode/utility');
const TelegramAPI = require('../SharedCode/bot/telegram_api');

async function main () {
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

    // const result = await rutenAPI.check(productId, url);
    const result = await rutenAPI.check2(productId);

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

main().then(() => console.log('Done')).catch((e) => console.error(e));
