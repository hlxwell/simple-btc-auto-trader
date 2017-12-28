var bitbank = require("node-bitbankcc");
var async = require("async");
var cache = require("./cache").cache;

var api_key = process.env["BITBANK_KEY"]
var api_secret = process.env["BITBANK_SECRET"]

// *****************
// 設定 / Settings
// *****************
var api = bitbank.privateApi(api_key, api_secret);
var orderAmout = 0.0002; // 一次购买的数量
var maxHoldBtc = 0.002; // BTC最多保有量
var spreadPercentage = 0.001; // 默认设定 0.1% 上下浮动价格
// 加入 1BTC=135000円的话、买卖的时候就去找中央值的上下135円的差值去交易。
var pair = "btc_jpy";

module.exports.trade = function() {
  console.log("--- prepare to trade ---");

  async.waterfall([
    function(callback) {
      // 获取资产
      api.getAsset().then(function(res){
        callback(null, res);
      });
    },

    function(assets, callback) {
      // BTC的数量
      var btcAvailable = Number(assets.assets.filter(function(element, index, array) {
        return element.asset == "btc";
      })[0].free_amount);

      // JPY的数量
      var jpyAvailable = Number(assets.assets.filter(function(element, index, array) {
        return element.asset == "jpy";
      })[0].free_amount);

      // 当前的未成交的订单
      api.getActiveOrders(pair, {}).then(function(res){
        callback(null, btcAvailable, jpyAvailable, res);
      });
    },

    function(btcAvailable, jpyAvailable, activeOrders, callback) {
      // console.log("--- active orders ---");
      // console.log(activeOrders);

      // 获取所有订单的id
      var ids = activeOrders.orders.map(function(element, index, array) {
        return element.order_id;
      });

      // 取消所有的当前订单
      if(ids.length > 0) {
        console.log("--- cancel all active orders ---");

        api.cancelOrders(pair, ids).then(function(res) {
          // console.log(res); // 订单取消结果
          callback(null, btcAvailable, jpyAvailable);
        });
      } else {
        callback(null, btcAvailable, jpyAvailable);
      }
    },

    function(btcAvailable, jpyAvailable, callback) {
      // 新建订单
      var bestBid = parseInt(cache.get("best_bid"));
      var bestAsk = parseInt(cache.get("best_ask"));
      var spread = (bestBid + bestAsk) * 0.5 * spreadPercentage;
      var buyPrice = parseInt(bestBid - spread);
      var sellPrice = parseInt(bestAsk + spread);

      // 如果拥有的BTC超过了最多持有量的话就不操作了。
      if(btcAvailable > maxHoldBtc) {
        callback("BTC amount is over the threthold.", null);
      }

      // 下卖的订单
      if(btcAvailable > orderAmout) {
        console.log("--- sell order --- ", sellPrice, orderAmout);
        api.order(pair, sellPrice, orderAmout, "sell", "limit").then(function(orderRes) {
          //console.log(orderRes);
        });
      }

      // 下买的订单
      if(jpyAvailable > buyPrice * orderAmout) {
        console.log("--- buy order --- ", buyPrice, orderAmout);
        api.order(pair, buyPrice, orderAmout, "buy", "limit").then(function(orderRes) {
          //console.log(orderRes);
        });
      }
    }
  ],

  function(err, results) {
    if(err){
      console.log("[ERROR] " + err);
    }
  });

};
