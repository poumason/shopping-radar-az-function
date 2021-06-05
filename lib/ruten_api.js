const axios = require('axios');
const cheerio = require('cheerio');

class RutenAPI {
  async check (productId, url) {
    const response = await axios.get(url);
    console.log(`status code: ${response.status}`);
    // const isReserve = this._getEnableReserve(productId, response.data);
    const isSale = this._getEnableSale(productId, response.data);

    console.log(`是否可以購買: ${isSale}`);

    return isSale;
  }

  _getEnableSale (productId, html) {
    let enableSale = false;
    const $ = cheerio.load(html);
    $('script').each((i, elem) => {
      const text = $(elem).html();
      const str = 'RT.context = ';

      if (text.indexOf(str) >= 0) {
      // console.log('got it');
        const strJson = text.substr(text.indexOf(str) + str.length).replace(';', '');
        const json = JSON.parse(strJson);
        // console.log(json);
        const item = json.item;
        // console.log(item);

        const isSeller = json.isSeller || !1;
        const isSoldEnd = item.isSoldEnd || !1;
        const isSoldOut = (item.remainNum || 0) <= 0;
        const showBuyerSoldOutBlock = !isSeller && isSoldOut;
        const gMode = item.mode || 'B';
        const isPreviewMode = !1;
        const showBidBlock = gMode === 'A' && !isSoldOut && !isSoldEnd;
        const showBidSoldEndMessage = (gMode === 'A' && isPreviewMode) || (!showBidBlock && gMode === 'A');

        enableSale = isSoldEnd || !showBuyerSoldOutBlock || showBidSoldEndMessage;
      }
    });

    return enableSale;
  }

  // _getEnableReserve (productId, html) {
  //   let enableReserve = false;
  //   const $ = cheerio.load(html);
  //   $('div').each((i, elem) => {
  //     const $script = $(elem).find('script');

  //     if ($script.attr('type') === 'application/ld+json') {
  //       const json = JSON.parse($script.html());

  //       if (json) {
  //         const _product = json['@type'];
  //         const _id = json.productId;
  //         const _name = json.name;

  //         if (_product.toLowerCase() === 'product' && _id === productId) {
  //           // 金額異常高為額滿商品請勿下標 ( 例:尾數XXX9999 或 XXX0000)
  //           const price = json.offers.price;
  //           const lastNumber = price.substr(price.length - 4);
  //           if (lastNumber === '9999' || lastNumber === '0000') {
  //             console.log(`${_name} 未開賣`);
  //             enableReserve = false;
  //           } else {
  //             console.log(`${_name} 開賣`);
  //             enableReserve = true;
  //           }
  //         }
  //       }
  //     }
  //   });
  //   return enableReserve;
  // }
}

module.exports = RutenAPI;
