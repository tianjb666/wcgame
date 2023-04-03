let enumeration = require('../../../constant/enumeration');
let code = require('../../../constant/code');
let pomelo = require('pomelo');
let dao = require('../../../dao/commonDao');
let logger = require('pomelo-logger').getLogger('recharge');
let rechargeServices = require('../../../services/rechargeServices');

module.exports = function (app, http) {
    http.post('/anxenPay', function (req, res) {
        res.json({
            "code": "0",
            "msg": "SUCCESS"
        });
        let body = req.body;
        logger.info(JSON.stringify(body));
        dao.findOneData("rechargeRecordModel", {platformReturnOrderID: body.seqNo}, function (err, result) {
            if (!!result){
                logger.error("anxenPay err: order already detailed");
            }else{
                rechargeServices.VerifyANXEN(body, function (err) {
                    if (!!err){
                        logger.error("anxenPay err: " + err);
                    }else{
                        logger.info("anxenPay success");
                    }
                })
            }
        })
    });
};