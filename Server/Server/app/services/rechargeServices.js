/**
 * Created by 1718841401 on 2017/7/12.
 */
let enumeration = require('../constant/enumeration');
let code = require('../constant/code');
let recordDao = require('../dao/recordDao');
let dao = require('../dao/commonDao');
let userDao = require('../dao/userDao');
let updateUserInfoServices = require('./userInfoServices');
let async = require('async');
let utils = require('../util/utils');
let pushAPI = require('../API/pushAPI');
let jsMd5 = require('js-md5');
let pomelo = require('pomelo');
let httpService = require('../services/httpRequestServices');
let rechargeLogger = require('pomelo-logger').getLogger('recharge');
let app = pomelo.app;

let service = module.exports;

service.sendPurchaseItem = function(uid, amount, platform, rechargeInfo, cb){
    let userData = null;
    async.series([
        function(cb){
            userDao.getUserDataByUid(uid, function(err, result){
                if (!!err){
                    rechargeLogger.error('sendPurchaseItem err:' + err);
                    cb(err);
                }else if (!result){
                    cb(code.HALL.NOT_FIND);
                }else{
                    userData = result;
                    cb();
                }
            })
        },
        function(cb){
            // 记录充值信息
            let rechargerData = {
                uid: userData.uid,
                nickname: userData.nickname,
                spreaderID: userData.spreaderID,
                channelID: userData.channelID,
                createTime: Date.now(),
                rechargeMoney: amount,
                userOrderID: rechargeInfo.userOrderID,
                platformReturnOrderID: rechargeInfo.platformReturnOrderID
            };
            dao.createData("rechargeRecordModel", rechargerData, function (err) {
                if(!!err){
                    rechargeLogger.error("sendPurchaseItem createData rechargeRecordModel err：" + err);
                }
                cb(err);
            });
        },
        function(cb){
            // 更新用户信息
            let updateUserData = {
                $inc: {
                    gold: amount
                }
            };
            userDao.updateUserData(uid, updateUserData, function (err, result) {
                if (!!err){
                    cb(err);
                }else{
                    if(!!userData.frontendId){
                        updateUserInfoServices.updateUserDataNotify(uid, userData.frontendId, {gold: result.gold});
                    }
                    cb();
                }
            });
        }
    ], function(err){
        cb(err);
        if(!!userData && !!userData.frontendId){
            pushAPI.popDialogContentPush({code: !!err?code.RECHARGE.RECHARGE_FAIL:code.RECHARGE.RECHARGE_SUCCESS}, [{uid: uid, sid: userData.frontendId}], function(err){
                if(!!err){
                    rechargeLogger.error('popDialogContentPush err:' + err);
                }
            });
        }
    });
};

// ----------------------------------------------安付通支付相关--------------------------------------------
service.buildRechargeRequestDataANXEN = function (uid, item, rechargeInfo, cb) {
    let publicParameter = pomelo.app.get('publicParameter');
    let gameServerUrl  = publicParameter["gameServerUrl"];
    let webServerUrl = publicParameter["webServerUrl"];

    let count = rechargeInfo.count;

    let bankcode;
    switch (rechargeInfo.payType){
        case enumeration.PAY_TYPE.WE_CHAT:
            bankcode = "1472";
            break;
        case enumeration.PAY_TYPE.ALI_PAY:
            bankcode = "1469";
            break;
        case enumeration.PAY_TYPE.QQ_PAY:
            bankcode = "1471";
            break;
        case enumeration.PAY_TYPE.UNION_PAY:
            bankcode = "1470";
            break;
        default:
            bankcode = "1472";
            break;
    }

    let requestParams = {
        pay_memberid: publicParameter["ANXEN_memberid"],
        pay_orderid: "ANXEN" + utils.randomString(15),
        pay_applydate: (new Date()).format('yyyy-MM-dd hh:mm:ss'),
        pay_bankcode: bankcode,
        pay_amount: count.toString(),
        pay_notifyurl: gameServerUrl + "/anxenPay",
        pay_callbackurl: webServerUrl + "/web-recharge"
    };

    requestParams.pay_md5sign = service.buildSignANXEN(requestParams, publicParameter["ANXEN_key"]);
    requestParams.pay_productname = "充值";

    let saveData = {
        orderID: requestParams.pay_orderid,
        uid: uid,
        itemID: requestParams.pay_amount,
        createTime: Date.now()
    };
    dao.createData("rechargeOrderRecordModel", saveData, function (err) {
        if (!!err){
            rechargeLogger.error("buildRechargeRequestDataANXEN rechargeOrderRecordModel err:" + err);
            utils.invokeCallback(cb, err);
        }else{
            console.log(requestParams);
            utils.invokeCallback(cb, null, webServerUrl + "/web-recharge/index.html?data=" + encodeURI(JSON.stringify(requestParams)));
        }
    });

    /*httpService.httpPost("https://www.aa168zf.com/Pay_Index.html", requestParams, function (err, res) {
        if (!!err){
            rechargeLogger.error("buildRechargeRequestDataANXEN rechargeOrderRecordModel err:" + JSON.stringify(err));
            utils.invokeCallback(cb, err);
        }else{
            let saveData = {
                orderID: requestParams.pay_orderid,
                uid: uid,
                itemID: requestParams.pay_amount,
                createTime: Date.now()
            };
            dao.createData("rechargeOrderRecordModel", saveData, function (err) {
                if (!!err){
                    rechargeLogger.error("buildRechargeRequestDataANXEN rechargeOrderRecordModel err:" + err);
                    utils.invokeCallback(cb, err);
                }else{
                    utils.invokeCallback(cb, null, webServerUrl + "/web-recharge/index.html?data=" + encodeURI(JSON.stringify(requestParams)));
                }
            });
        }
    });*/
};

service.VerifyANXEN = function (data, cb) {
    let publicParameter = pomelo.app.get('publicParameter');
    let orderRecordData = null;
    let amount = parseFloat(data.amount);
    let self = this;
    async.series([
        // 验证签名
        function(cb){
            let signData = {
                memberid: data.memberid,
                orderid: data.orderid,
                amount: data.amount,
                transaction_id: data.transaction_id,
                datetime: data.datetime,
                returncode: data.returncode
            };
            let sign = service.buildSignANXEN(signData, publicParameter["ANXEN_key"]);
            if(sign === data.sign){
                cb();
            }else{
                rechargeLogger.error("VerifyJXYL error: sign check err");
                cb(code.RECHARGE.SIGN_CHECK_ERR);
            }
        },
        // 获取订单信息
        function(cb){
            dao.findOneData("rechargeOrderRecordModel", {orderID: data.orderid}, function(err, result){
                if (!!err){
                    cb(err);
                }else{
                    if (!result){
                        rechargeLogger.error("can not find orderID");
                        cb(code.RECHARGE.MONEY_COUNT_ERR);
                    }else{
                        orderRecordData = result._doc;
                        cb();
                    }
                }
            })
        },
        // 删除订单信息
        function(cb){
            dao.deleteData("rechargeOrderRecordModel", {orderID: data.orderid}, function(err, result){
                if (!!err){
                    cb(err);
                }else{
                    if (!!result && result.result.n > 0){
                        cb();
                    }else{
                        rechargeLogger.error("can not find orderID");
                        cb(code.RECHARGE.MONEY_COUNT_ERR);
                    }
                }
            });
        },
        function(cb){
            let order_no_info = {
                userOrderID: data.orderid,
                platformReturnOrderID: data.transaction_id
            };
            self.sendPurchaseItem(orderRecordData.uid, amount, enumeration.RechargePlatform.ANXEN_PAY, order_no_info, cb);
        }
    ], function(err){
        if (!!err){
            rechargeLogger.error("RMVerify", "err:" + err);
        }
        cb(err);
    })
};

service.buildSignANXEN = function (signParameter,  privateKey) {
    // 排序
    let preStr = '';
    let keySet = [];
    for(let key of Object.keys(signParameter).sort()){
        if(!signParameter[key] || key === 'sign'){
            continue;
        }
        keySet.push(key);
    }

    for(let i = 0; i < keySet.length; i ++){
        let key = keySet[i];
        let value = signParameter[key];
        if(i === keySet.length - 1){
            preStr = preStr + key + '=' + value + '';
        }else{
            preStr = preStr + key + '=' + value + '&';
        }
    }
    preStr += "&key=" + privateKey;
    return jsMd5(preStr).toUpperCase();
};
// ----------------------------------------------融脉支付相关------------------------------------------------

service.buildWXRechargeRequestData = function (uid, item, rechargeInfo, cb) {
    let requestParams = {
        appid: app.get('publicParameter').appID,
        mch_id: app.get('publicParameter').WXPay_MCH_ID,
        nonce_str: utils.randomString(32),
        sign: '123',
        body: '房卡' + item.key,//商品简单描述，该字段请按照规范传递，具体请见参数规定
        attach: JSON.stringify({
            itemID: item.key,
            uid: uid
        }),//附加数据，在查询API和支付通知中原样返回，可作为自定义参数使用。
        out_trade_no: 'WXPAY' + (new Date()).valueOf(),
        total_fee: item.priceCount.toFixed(2),//订单总金额，单位为分，详见支付金额
        spbill_create_ip: rechargeInfo.lastLoginIP,
        notify_url: app.get('publicParameter').WXPay_notify_url,
        trade_type: 'JSAPI',//取值如下：JSAPI，NATIVE，APP等，说明详见参数规定
        openid: rechargeInfo.openid,//trade_type=JSAPI时（即公众号支付），此参数必传，此参数为微信用户在商户对应appid下的唯一标识。openid如何获取，可参考【获取openid】。企业号请使用【企业号OAuth2.0接口】获取企业号内成员userid，再调用【企业号userid转openid接口】进行转换

        // limit_pay: 'no_credit',//上传此参数no_credit--可限制用户不能使用信用卡支付
        // device_info: '123',//自定义参数，可以为终端设备号(门店号或收银设备ID)，PC网页或公众号内支付可以传"WEB"
        // sign_type: '123',//签名类型，默认为MD5，支持HMAC-SHA256和MD5。
        // detail: '123',//商品详细描述，对于使用单品优惠的商户，改字段必须按照规范上传，详见“单品优惠参数说明”
        // fee_type: '123',//符合ISO 4217标准的三位字母代码，默认人民币：CNY，详细列表请参见货币类型
        // time_start: '123',
        // time_expire: '123',
        // goods_tag: '123',
        // product_id: '123',//trade_type=NATIVE时（即扫码支付），此参数必传。此参数为二维码中包含的商品ID，商户自行定义。
        // scene_info: '123'
    };

    //去除无效参数，排序并生成待签名字符串
    let preStr = '';
    let keySet = [];
    for(let key of Object.keys(requestParams).sort()){
        if(!requestParams[key] || key === 'sign'){
            continue;
        }
        keySet.push(key);
    }

    for(let i = 0; i < keySet.length; i ++){
        key = keySet[i];
        let value = requestParams[key];
        if(i === keySet.length - 1){
            preStr = preStr + key + '=' + value + '';
        }else{
            preStr = preStr + key + '=' + value + '&';
        }
    }

    //拼接API密钥
    preStr = preStr + '&key=' + app.get('publicParameter').WXPay_KEY;
    requestParams.sign = jsMd5(preStr);

    httpService.httpPostXml(app.get('publicParameter').WXPay_GATEWAY_URL, requestParams, function (err, body) {
        cb(err, body);
    });
};

service.WXPayVerify = function (data, cb) {
    //验证调用返回或微信主动通知签名时，传送的sign参数不参与签名，将生成的签名与该sign值作校验。
    rechargeLogger.log(data);
};

service.buildALIRechargeRequestData = function (uid, item, rechargeInfo) {
    //网关地址，示例中为沙箱环境,正式环境请修改为https://openapi.alipay.com/gateway.do?
    let GATEWAY_URL = app.get('publicParameter').AliPay_GATEWAY_URL;
    let APP_ID = app.get('publicParameter').AliPay_APP_ID;
    //签名方式
    let SIGN_TYPE = app.get('publicParameter').AliPay_SIGN_TYPE;
    //将RSA公私钥转换为PEM格式
    let privateKey = '-----BEGIN PRIVATE KEY-----\n' + app.get('publicParameter').AliPay_PRIVATE_KEY + '\n-----END PRIVATE KEY-----';
    //准备业务请求参数、签名用的应用私钥、验签用的支付宝公钥，示例中为预下单接口
    let requestParams = {
        timestamp: (new Date(Date.now())).format("yyyy-MM-dd hh:mm:ss"),
        method: 'alipay.trade.wap.pay',
        // method: 'alipay.trade.query',
        app_id: APP_ID,
        sign_type: SIGN_TYPE,
        charset:'utf-8',
        version: '1.0',
        notify_url: app.get('publicParameter').AliPay_notify_url,//支付宝服务器主动通知商户服务器里指定的页面http/https路径。
        biz_content: {
            total_amount: item.priceCount.toFixed(2),
            product_code: 'QUICK_WAP_WAY',
            subject: '房卡' + item.key,
            out_trade_no: 'ALIPAY' + (new Date()).valueOf(),
            // body: '',
            // seller_id: '',//收款支付宝用户ID。 如果该值为空，则默认为商户签约账号对应的支付宝用户ID
            // auth_token: '',//针对用户授权接口，获取用户相关数据时，用于标识用户授权关系
            // timeout_express: '',
            // time_expire: '',//绝对超时时间，格式为yyyy-MM-dd HH:mm。 注：1）以支付宝系统时间为准；2）如果和timeout_express参数同时传入，以time_expire为准。
            // goods_type: '',//商品主类型：0—虚拟类商品，1—实物类商品  注：虚拟类商品不支持使用花呗渠道
            passback_params: JSON.stringify({
                itemID: item.key,
                uid: uid
            }),//公用回传参数，如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
            // promo_params: '',//优惠参数     注：仅与支付宝协商后可用
            // extend_params: '',//业务扩展参数
            // enable_pay_channels: '',//可用渠道，用户只能在指定渠道范围内支付   当有多个渠道时用“,”分隔   注：与disable_pay_channels互斥
            // disable_pay_channels: '',//	禁用渠道，用户不可用指定渠道支付    当有多个渠道时用“,”分隔   注：与enable_pay_channels互斥
            // store_id: '',//商户门店编号。该参数用于请求参数中以区分各门店，非必传项。
            // quit_url: ''//添加该参数后在h5支付收银台会出现返回按钮，可用于用户付款中途退出并返回到该参数指定的商户网站地址。    注：该参数对支付宝钱包标准收银台下的跳转不生效。
        },

        //     format: '',//仅支持JSON
        //     return_url: '',//HTTP/HTTPS开头字符串
    };
    //将biz_content参数序列化为JSON格式字符串
    requestParams.biz_content = JSON.stringify(requestParams.biz_content);
    //去除无效参数，排序并生成待签名字符串
    let preStr = '';
    let keySet = [];
    for(let key of Object.keys(requestParams).sort()){
        if(!requestParams[key] || key === 'sign'){
            continue;
        }
        keySet.push(key);
    }

    for(let i = 0; i < keySet.length; i ++){
        key = keySet[i];
        let value = requestParams[key];
        if(i === keySet.length - 1){
            preStr = preStr + key + '=' + value + '';
        }else{
            preStr = preStr + key + '=' + value + '&';
        }
    }

    //生成签名
    let crypto = require('crypto');
    let signer = crypto.createSign('RSA-SHA256');
    if(SIGN_TYPE === 'RSA'){
        signer = crypto.createSign('RSA-SHA1');
    }
    signer.update(preStr);
    let sign = signer.sign(privateKey, 'base64');
    // console.log('生成的签名串为：', sign);

    //请求支付宝
    let qs = require('querystring');
    requestParams.sign = sign;
    let content = qs.stringify(requestParams);

    return GATEWAY_URL + content;
};

service.AliPayVerify = function (body, cb) {
    //支付宝通知消息体
    // {
    //     gmt_create: '2017-10-18 11:47:53',
    //     charset: 'utf-8',
    //     seller_email: 'ffnynb3652@sandbox.com',
    //     subject: '房卡1',
    //     sign: 'ffxxaUqFYq2FSAHzMcHv+xrvNebRofGcT5YRx92hbKmsm+ad+nmsPoD7JyhVVMJwe8fDX/5VSvNQbQXoy0GL4iGyHUrfS/bbBq6Baz0ALSKsf2cmBD0RaIitBmAQfXgViudIUtguElo7JvoYNStUbMGb0NA8Ig7xcXa1s13S/I0ZDqDYBtOV0qmm06SSxZ36HERNxyWGr2OVxWGpDnQ5+snPXgLRvyFkZg7HZxAYCYGtZkCCkkgRq5jAW7FcaDMxlv0JpUW6mjiCQ3gsZ1vIakYd7TvabcGz9vd6txs1LpBOn+WBRZ6QffHfC5EmcODY2X2F+ChkDwpBNTEwG+aIIw==',
    //     buyer_id: '2088102174861682',
    //     invoice_amount: '1.00',
    //     notify_id: 'f2783372e41f5da70ced654900c859fl8y',
    //     fund_bill_list: '[{"amount":"1.00","fundChannel":"ALIPAYACCOUNT"}]',
    //     notify_type: 'trade_status_sync',
    //     trade_status: 'TRADE_SUCCESS',
    //     receipt_amount: '1.00',
    //     app_id: '2016080800191710',
    //     buyer_pay_amount: '1.00',
    //     sign_type: 'RSA2',
    //     seller_id: '2088102170412909',
    //     gmt_payment: '2017-10-18 11:47:53',
    //     notify_time: '2017-10-18 11:48:14',
    //     passback_params: '{"itemID":"1","uid":"100040"}',
    //     version: '1.0',
    //     out_trade_no: 'SSS1508298463453',
    //     total_amount: '1.00',
    //     trade_no: '2017101821001004680200199942',
    //     auth_app_id: '2016080800191710',
    //     buyer_logon_id: 'sgd***@sandbox.com',
    //     point_amount: '0.00'
    // }

    //对消息进行验签
    let SIGN_TYPE = app.get('publicParameter').AliPay_SIGN_TYPE;
    //支付宝公钥（在支付宝开放平台填写应用公钥之后生成）
    let aliPublicKey = '-----BEGIN PUBLIC KEY-----\n' + app.get('publicParameter').AliPay_ALI_PUBLIC_KEY + '\n-----END PUBLIC KEY-----';
    let preStr = '';
    let keySet = [];
    for(let key of Object.keys(body).sort()){
        if(!body[key] || key === 'sign' || key === 'sign_type'){
            continue;
        }
        keySet.push(key);
    }

    for(let i = 0; i < keySet.length; i ++){
        key = keySet[i];
        let value = body[key];
        if(i === keySet.length - 1){
            preStr = preStr + decodeURI(key + '=' + value) + '';
        }else{
            preStr = preStr + decodeURI(key + '=' + value) + '&';
        }
    }

    let crypto = require('crypto');
    let verifier = crypto.createVerify('RSA-SHA256');
    if(SIGN_TYPE === 'RSA'){
        verifier = crypto.createVerify('RSA-SHA1');
    }
    verifier.update(preStr);

    //验签通过
    if (verifier.verify(aliPublicKey, body.sign, 'base64')) {
        rechargeLogger.info('验签OK');
        //交易完成
        if (body.trade_status === 'TRADE_SUCCESS') {

            rechargeLogger.info('交易OK，开始发货');
            //发货
            let passback_params = JSON.parse(body.passback_params);
            let item = null;
            let self = this;
            async.waterfall([
                function(cb){
                    // 检查请求数据
                    if (!passback_params.uid || !passback_params.itemID){
                        cb(code.HALL.REQUEST_DATA_ERROR);
                    }else{
                        cb();
                    }
                },
                function(cb){
                    // 验证商品信息
                    let shopItems = JSON.parse(app.get('publicParameter')['shopItems']);
                    for(let j = 0; j < shopItems.length; ++j){
                        let shopItem = shopItems[j];
                        if (shopItem.key + '' === passback_params.itemID + ''){
                            item = shopItem;
                            break;
                        }
                    }
                    if (!item){
                        cb(code.RECHARGE.ITEM_NOT_FIND);
                    }else if (item.priceCount !== parseFloat(body.buyer_pay_amount)){
                        cb(code.RECHARGE.MONEY_COUNT_ERR);
                    }else{
                        cb();
                    }
                },
                function(cb){
                    let order_no_info = {
                        userOrderID: body.out_trade_no,
                        platformReturnOrderID: body.trade_no
                    };
                    self.sendPurchaseItem(passback_params.uid, item, enumeration.RechargePlatform.ALI, order_no_info, cb);
                }
            ], function(err){
                if (!!err){
                    rechargeLogger.error("sendPurchaseItem err:" + err);
                }
                cb(err);
            });
        }else{
            rechargeLogger.error('交易失败');
            cb(code.FAIL);
        }
    }else{
        rechargeLogger.error('验签失败');
        cb(code.FAIL);
    }
};
