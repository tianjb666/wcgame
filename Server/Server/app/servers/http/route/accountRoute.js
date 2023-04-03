let pomelo = require('pomelo');
let enumeration = require('../../../constant/enumeration');
let code = require('../../../constant/code');
let async = require('async');
let accountServices = require('../../../services/accountServices');
let commonDao = require('../../../dao/commonDao');
let logger = require('pomelo-logger').getLogger('pomelo');
let authServices = require('../../../services/authServices');

module.exports = function (app, http) {
    //转发客户端httpGet请求
    http.post('/register', function(req, res){
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        let account = req.body.account || null;
        let password = req.body.password || null;
        let loginPlatform = req.body.loginPlatform || null;
        loginPlatform = parseInt(loginPlatform);
        let spreaderID = req.body.spreaderID || "";
        let smsCode = req.body.smsCode || "";
        if (!accountServices.checkAccountAndPassword(account, password, loginPlatform)){
            res.end(JSON.stringify({code: code.REQUEST_DATA_ERROR}));
            return;
        }
        let saveData = {};
        let matchData = {};
        if (loginPlatform === enumeration.loginPlatform.ACCOUNT){
            matchData.account = account;

            saveData.account = account;
            saveData.password = password;
            saveData.spreaderID = spreaderID;
        }else if(loginPlatform === enumeration.loginPlatform.MOBILE_PHONE){
            matchData.phoneAccount = account;

            saveData.phoneAccount = account;
            saveData.password = password;
            saveData.spreaderID = spreaderID;
        }else if(loginPlatform === enumeration.loginPlatform.WEI_XIN){
            matchData.wxAccount = account;

            saveData.wxAccount = account;
            saveData.spreaderID = spreaderID;
        }
        let accountData = null;
        async.series([
            function (cb) {
                // 检查是否需要验证短信
                if (loginPlatform === enumeration.loginPlatform.MOBILE_PHONE){
                    let isAuthPhone = pomelo.app.get('publicParameter')["authPhone"] === "true";
                    if (isAuthPhone){
                        if (!smsCode){
                            cb(code.SMS_CODE_ERROR);
                        }else{
                            authServices.authSmsCode(account, smsCode, cb);
                        }
                    }else{
                        cb();
                    }
                }else{
                    cb();
                }
            },
            function (cb) {
                commonDao.findOneData("accountModel", matchData, function (err, result) {
                    if (!!err){
                        cb(err);
                    }else{
                        if (!result){
                            // 注册账号
                            accountServices.registerAccount(account, password, loginPlatform, spreaderID, function (err, result1) {
                                if (!!err){
                                    cb(err);
                                }else{
                                    accountData = result1;
                                    cb();
                                }
                            })
                        }else{
                            // 判定账号信息
                            if (loginPlatform === enumeration.loginPlatform.WEI_XIN){
                                // 执行用户登录
                                accountData = result._doc;
                                cb();
                            }else{
                                cb(code.LOGIN.ACCOUNT_EXIST);
                            }
                        }
                    }
                })
            }
        ], function (err) {
            if (!!err){
                res.end(JSON.stringify({code: err}));
            }else{
                let msg = accountServices.dispatcherServers(pomelo.app.getServersByType('connector'), accountData.uid);
                if(!msg){
                    res.end(JSON.stringify({code: code.LOGIN.GET_HALL_SERVERS_FAIL}));
                }else{
                    res.end(JSON.stringify({code: code.OK, msg: msg}));
                }
            }
        });
    });

    http.post('/login', function (req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        let account = req.body.account || null;
        let password = req.body.password || null;
        let loginPlatform = req.body.loginPlatform || null;
        if (!account || !password || !loginPlatform) {
            res.end(JSON.stringify({code: code.REQUEST_DATA_ERROR}));
            return;
        }
        loginPlatform = parseInt(loginPlatform);
        let matchData = {};
        if (loginPlatform === enumeration.loginPlatform.ACCOUNT){
            matchData.account = account;
            matchData.password = password;
        }else if(loginPlatform === enumeration.loginPlatform.MOBILE_PHONE){
            matchData.phoneAccount = account;
            matchData.password = password;
        }else if (loginPlatform === enumeration.loginPlatform.WEI_XIN){
            matchData.wxAccount = account;
        }else{
            res.end(JSON.stringify({code: code.REQUEST_DATA_ERROR}));
            return;
        }

        commonDao.findOneData("accountModel", matchData, function (err, result) {
            if (!!err || !result) {
                res.end(JSON.stringify({code: code.LOGIN.ACCOUNT_OR_PASSWORD_ERROR}));
            }else{
                let msg = accountServices.dispatcherServers(pomelo.app.getServersByType('connector'), result.uid);
                if(!msg){
                    res.end(JSON.stringify({code: code.LOGIN.GET_HALL_SERVERS_FAIL}));
                }else{
                    res.end(JSON.stringify({code: code.OK, msg: msg}));
                }
            }
        });
    });

    http.post('/resetPasswordByPhone', function (req, res) {
        let account = req.body.account || null;
        let newPassword = req.body.newPassword || null;
        let smsCode = req.body.smsCode || null;
        if(!account || !newPassword || !smsCode){
            res.end(JSON.stringify({code: code.REQUEST_DATA_ERROR}));
            return;
        }
        async.series([
            function (cb) {
                commonDao.findOneData("accountModel", {phoneAccount: account}, function (err, result) {
                    if (!!err){
                        cb(err);
                    }else{
                        if (!result){
                            cb(code.LOGIN.ACCOUNT_NOT_EXIST);
                        }else{
                            cb();
                        }
                    }
                })
            },
            function (cb) {
                authServices.authSmsCode(account, smsCode, cb)
            },
            function (cb) {
                commonDao.updateData("accountModel", {phoneAccount: account}, {password: newPassword}, function (err) {
                    cb(err);
                })
            }
        ], function (err) {
            if (!!err){
                res.end(JSON.stringify({code: err}));
            }else{
                res.end(JSON.stringify({code: code.OK}));
            }
        })
    })
};