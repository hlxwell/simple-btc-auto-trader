var logic = require("./lib/logic");
var cache = require("./lib/cache").cache;

var SUBSCRIBE_KEY = "sub-c-e12e9174-dd60-11e6-806b-02ee2ddab7fe";

var PubNub = require("pubnub");
var pubnub = new PubNub({ subscribeKey: SUBSCRIBE_KEY });


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

console.log("--- start show price ---");

