var code = require('../../../constant/code');
var enumeration = require('../../../constant/enumeration');
var userInfoServices = require('../../../services/userInfoServices');
var async = require('async');
let userDao = require('../../../dao/userDao');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

Handler.prototype.readEmail = function (msg, session, next) {
    if (!session.uid){
        next(null, {code: code.INVALID_UERS});
        return;
    }
    if (!msg.emailID){
        next(null, {code: code.REQUEST_DATA_ERROR});
        return;
    }
    userDao.loadUserDataByUid(session.uid, function (err, result) {
        if (!!err){
            next(null, {code: code.INVALID_UERS});
        }else{
            if (!result){
                next(null, {code: code.HALL.NOT_FIND});
            }else{
                if (result.emailArr.length === 0){
                    next(null, {code: code.REQUEST_DATA_ERROR});
                    return;
                }
                let emailArr = JSON.parse(result.emailArr);
                let isUpdate = false;
                for (let i = 0; i < emailArr.length; ++i){
                    let info = emailArr[i];
                    if (info.id === msg.emailID){
                        if (info.isRead) break;
                        info.isRead = true;
                        isUpdate = true;
                        break;
                    }
                }
                if (isUpdate){
                    userDao.updateUserData(session.uid, {emailArr: JSON.stringify(emailArr)});
                    userInfoServices.updateUserDataNotify(session.uid, result.frontendId, {emailArr: JSON.stringify(emailArr)});
                }
                next(null, {code :code.OK});
            }
        }
    });
};