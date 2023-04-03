let async = require('async');
let code = require('../../../constant/code');
let rechargeServices = require('../../../services/rechargeServices');
let enumeration = require('../../../constant/enumeration');

module.exports = function(app) {
    return new Handler(app);
};

let Handler = function(app) {
    this.app = app;
    this.publicParameter = app.get('publicParameter');
};

Handler.prototype.purchaseItem = function (msg, session, next){
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    let count = msg.rechargeInfo.count;
    if ((typeof count !== 'number') || count <= 0){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
    let publicParameter = this.app.get('publicParameter');
    let requestData;
    async.series([
        function (cb){
            // 充值关闭时
            if (publicParameter['freeShopItem'] === 'free'){
                rechargeServices.sendPurchaseItem(session.uid, count, enumeration.RechargePlatform.NONE, {userOrderID: 0, platformReturnOrderID:0}, cb);
            }else{
                // 聚闲娱乐支付
                if (msg.rechargePlatform === enumeration.RechargePlatform.ANXEN_PAY){
                    requestData = rechargeServices.buildRechargeRequestDataANXEN(session.uid, null, msg.rechargeInfo, function (err, res) {
                        if (!!err){
                            cb(err);
                        }else{
                            requestData = res;
                            cb();
                        }
                    });
                } else if(msg.rechargePlatform === enumeration.RechargePlatform.ALI){
                    requestData = rechargeServices.buildALIRechargeRequestData(session.uid, item, msg.rechargeInfo);
                    if (!requestData){
                        cb(code.REQUEST_DATA_ERROR);
                    }else{
                        cb();
                    }
                //微信
                } else if(msg.rechargePlatform === enumeration.RechargePlatform.WX){
                    rechargeServices.buildWXRechargeRequestData(session.uid, null, msg.rechargeInfo, function (err, res) {
                        if (!!err){
                            cb(err);
                        }else{
                            requestData = res;
                            cb();
                        }
                    });
                } else{
                    cb(code.REQUEST_DATA_ERROR);
                }
            }
        }
    ], function (err){
        if (!!err){
            console.error('purchaseItem error:' + err);
            next (null, {code: err});
        } else {
            next (null, {code: code.OK, msg: {url: requestData}});
        }
    });
};