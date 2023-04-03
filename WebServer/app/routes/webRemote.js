let async = require('async');
let accountService = require('../services/accountServices');
let code = require('../constant/code');
let commonDao = require('../dao/commonDao');
let enumeration = require('../constant/enumeration');
let express = require('express');
let router = express.Router();

router.post('/WebLoginByPhone', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    let account = req.body.mobile;
    let password = req.body.password;

    let returnData = {

    };

    if (!account || !password){
        returnData.error = {
            msg: "帐号或密码错误"
        };
        res.end(JSON.stringify(returnData));
    }else{
        let matchData = {
            account: account,
            password: password
        };
        commonDao.findOneData("accountModel", matchData, function (err, result) {
            if(!!err){
                returnData.error = {
                    msg: "帐号或密码错误"
                };
            }else{
                if(!result){
                    returnData.error = {
                        msg: "帐号或密码错误"
                    };
                }else{
                    returnData.state = 1;
                }
            }
            res.end(JSON.stringify(returnData));
        })
    }
});

router.post('/WebRegister', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    let mobile = req.body.mobile || "";
    let password = req.body.password || "";
    let pwdconfirm = req.body.pwdconfirm || "";
    let smsCode = req.body.captcha || "";
    let uniqueID = req.query.imgCodeUniqueID;
    let spreadID = req.query.spreadID;
    let forward = req.body.forward || "";
    async.series([
        // 验证数据
        function (cb) {
            if (!mobile || !password || !pwdconfirm || !uniqueID || !spreadID){
                cb("请填写完整的信息");
            }else if(password !== pwdconfirm){
                cb("两次输入密码不同");
            }else{
                cb();
            }
        },
        // 验证手机验证码
        function (cb) {
            cb();
        },
        // 进行注册
        function (cb) {
            accountService.registerAccount(mobile, password, enumeration.loginPlatform.ACCOUNT, spreadID, function (err) {
                if (!err){
                    cb();
                }else{
                    if (err === code.LOGIN.ACCOUNT_EXIST){
                        cb("帐号已存在");
                    }else{
                        cb("服务器错误");
                    }
                }
            })
        }
    ], function (err) {
        let returnData = {
        };
        if (!!err){
            returnData.error = {
                forward: forward,
                msg: err
            };
        }else{
            returnData.state = 1;
        }
        res.end(JSON.stringify(returnData));
    });
});

module.exports = router;