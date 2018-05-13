var logic = require("./lib/logic");
var cache = require("./lib/cache").cache;

var SUBSCRIBE_KEY = "sub-c-e12e9174-dd60-11e6-806b-02ee2ddab7fe";
var TICKER_CHANNEL = "ticker_btc_jpy";

var PubNub = require("pubnub");
var pubnub = new PubNub({ subscribeKey: SUBSCRIBE_KEY });

const getIndirectBuyPrice = function() {
  var btc_jpy_sell = calculateAvgPriceAmount(cache.get("btc_jpy_asks")).price;
  var bcc_btc_sell = calculateAvgPriceAmount(cache.get("bcc_btc_asks")).price;
  return bcc_btc_sell * btc_jpy_sell;
}

const getIndirectSellPrice = function() {
  var bcc_btc_buy = calculateAvgPriceAmount(cache.get("bcc_btc_bids")).price;
  var btc_jpy_buy = calculateAvgPriceAmount(cache.get("btc_jpy_bids")).price;
  return btc_jpy_buy * bcc_btc_buy;
}

const getDirectBuyPrice = function() {
  return calculateAvgPriceAmount(cache.get("bcc_jpy_asks")).price;
}

const getDirectSellPrice = function() {
  return calculateAvgPriceAmount(cache.get("bcc_jpy_bids")).price;
}

const profitByDirectBuyIndirectSell = function() {
  return (getIndirectSellPrice() - getDirectBuyPrice()) / getDirectBuyPrice() * 100;
}

const profitByIndirectBuyDirectSell = function() {
  return (getDirectSellPrice() - getIndirectBuyPrice()) / getIndirectBuyPrice() * 100;
}

const calculateAvgPriceAmount = function(priceAmounts) {
  if (!Array.isArray(priceAmounts)) {
    return {};
  }

  const amountPeducer = function(accumulator, currentValue) {
    var [price, amount] = currentValue;
    return accumulator + parseFloat(amount);
  };

  const priceReducer = function(accumulator, currentValue) {
    var [price, amount] = currentValue;
    return accumulator + parseFloat(price) * parseFloat(amount);
  };

  priceAmounts.forEach(function(priceAmount){
    var [price, amount] = priceAmount;
    price = parseFloat(price);
    amount = parseFloat(amount);

    return price * amount
  });

  totalAmount = priceAmounts.reduce(amountPeducer, 0);
  totalPrice = priceAmounts.reduce(priceReducer, 0);

  return {
    price: totalPrice / totalAmount,
    amount: totalAmount
  }
}

const buyBccDirectsellBccIndirectly = function() { }
const buyBccIndirectsellBccDirectly = function() { }

const showPriceDifference = function() {
  if (isNaN(getIndirectBuyPrice()) || isNaN(getIndirectSellPrice()) || isNaN(getDirectBuyPrice()) || isNaN(getDirectSellPrice())) { return; }

  if (profitByDirectBuyIndirectSell() > 0) {
    console.log("buy bcc by jpy profit rate is: " + profitByDirectBuyIndirectSell().toPrecision(2) + "% \t" + Date());
    buyBccDirectsellBccIndirectly();
  }

  if (profitByIndirectBuyDirectSell() > 0) {
    console.log("buy bcc by btc profit rate is: " + profitByIndirectBuyDirectSell().toPrecision(2) + "% \t" + Date());
    buyBccIndirectsellBccDirectly();
  }
}

pubnub.addListener({
  message: function(message) {
    switch (message.channel) {
    case 'ticker_btc_jpy':
      cache.set("btc_jpy_bid", message.message.data.buy);
      cache.set("btc_jpy_ask", message.message.data.sell);
      break;
    case 'ticker_bcc_jpy':
      cache.set("bcc_jpy_bid", message.message.data.buy);
      cache.set("bcc_jpy_ask", message.message.data.sell);
      break;
    case 'ticker_bcc_btc':
      cache.set("bcc_btc_bid", message.message.data.buy);
      cache.set("bcc_btc_ask", message.message.data.sell);
      break;
    case 'depth_btc_jpy':
      cache.set("btc_jpy_bids", message.message.data.bids.slice(0,1));
      cache.set("btc_jpy_asks", message.message.data.asks.slice(0,1));
      break;
    case 'depth_bcc_btc':
      cache.set("bcc_btc_bids", message.message.data.bids.slice(0,1));
      cache.set("bcc_btc_asks", message.message.data.asks.slice(0,1));
      break;
    case 'depth_bcc_jpy':
      cache.set("bcc_jpy_bids", message.message.data.bids.slice(0,1));
      cache.set("bcc_jpy_asks", message.message.data.asks.slice(0,1));
      break;
    default:
    }

    showPriceDifference();
  }
});

pubnub.subscribe({
  channels: [
    "depth_btc_jpy",
    "depth_bcc_btc",
    "depth_bcc_jpy",
    "ticker_btc_jpy",
    "ticker_bcc_btc",
    "ticker_bcc_jpy"
  ]
});

console.log("--- order process starts 60 sec later ---");

setInterval(function() {
  // console.log("===== New Round Trading =====");
  // logic.trade();
}, 1000 * 60);
