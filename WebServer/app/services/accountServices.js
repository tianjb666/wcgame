let utils = require('../util/utils');
let code = require('../constant/code');
let dao = require('../dao/commonDao');
let enumeration = require('../constant/enumeration');
let dispatcher = require('../util/dispatcher');
let token = require('../util/token');

let services = module.exports;

services.checkAccountAndPassword = function (account, password, loginPlatform) {
    if (!account || !password || !loginPlatform) return false;
    if (typeof account !== 'string' || typeof password !== 'string') return false;
    if (loginPlatform === enumeration.loginPlatform.ACCOUNT){
        return account.length <= 20 && password.length <= 20;
    }else if (loginPlatform === enumeration.loginPlatform.MOBILE_PHONE){
        return account.length === 11 && password.length < 20;
    }else if (loginPlatform === enumeration.loginPlatform.WEI_XIN){
        return true;
    }
    return false;
};

services.registerAccount = function (account, password, loginPlatform, spreaderID, cb) {
    if (!services.checkAccountAndPassword(account, password, loginPlatform)){
        utils.invokeCallback(cb, code.REQUEST_DATA_ERROR);
    }else {
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
        dao.findOneData("accountModel", matchData, function (err, result) {
            if (!!err){
                utils.invokeCallback(cb, err);
            }else{
                if (!result){
                    dao.createData("accountModel", saveData, function (err1, result1) {
                        if (!!err1 || !result1){
                            utils.invokeCallback(cb, err1);
                        }else{
                            utils.invokeCallback(cb, null, result1._doc);
                        }
                    })
                }else{
                    utils.invokeCallback(cb, code.LOGIN.ACCOUNT_EXIST);
                }
            }
        })
    }
};

services.dispatcherServers = function (Servers, uid) {
    //根据userID 分配hall服务器
    if (!Servers || Servers.length === 0) {
        return null;
    }
    let connector = dispatcher.dispatch(uid, Servers);
    return {
        serverInfo: {
            host: connector.clientHost,
            port: connector.clientPort
        },
        token: token.createToken(uid,connector.id)
    };
};