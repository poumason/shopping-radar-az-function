function isEmptyOrNull (str) {
  return (!str || str.length === 0);
}

function isAvailablePrice (price) {
  const strPrice = price.toString();
  // 金額異常高為額滿商品請勿下標 ( 例:尾數XXX9999 或 XXX0000)
  if (strPrice.length > 4) {
    const last = strPrice.slice(-4);
    return !(last === '9999' || last === '0000');
  } else {
    return true;
  }
}

module.exports = {
  isEmptyOrNull,
  isAvailablePrice
};
