var enumeration = require('../constant/enumeration');
var code = require('../constant/code');
var userInfoServices = require('./userInfoServices');
var async = require('async');
var utils = require('../util/utils');
var dispatch = require('../util/dispatcher');
var rpcAPI = require('../API/rpcAPI');
var pomelo = require('pomelo');
var userDao = require('../dao/userDao');

var service = module.exports;

service.sendSingleEmail = function(emailID, uid, title, content, diamond, coupon, cb){
    var user = pomelo.app.hallManager.getUserByUid(uid);
    var userData = null;
    var updateUserInfo = null;
    async.waterfall([
        function(cb){
            if (!!user){
                userData = user.userDetailData;
                cb();
            }else{
                userDao.getUserDataByUid(uid, function(err, result){
                    if (!!err || !result){
                        console.error("sendSingleEmail err getUserDataByUid:" + err);
                        cb(code.HALL.NOT_FIND);
                    }else{
                        userData = result._doc;
                        cb();
                    }
                });
            }
        },
        function(cb){
            var emailInfo = {
                id: emailID,
                title: title,
                content: content,
                isRead: false,
                status: enumeration.emailStatus.NOT_RECEIVE,
                createTime: Date.now()
            };
            userData.emailArr.push(JSON.stringify(emailInfo));
            updateUserInfo = {
                uid: uid,
                emailArr:userData.emailArr
            };
            userInfoServices.updateUserData(user, updateUserInfo, cb);
        },
        function(cb){
            userInfoServices.updateUserDataNotify(user, updateUserInfo, cb);
        }
    ], function(err){
        if (!!err){
            console.error("sendSingleEmail err:" + err);
        }
        cb(err);
    })
};

service.sendSingleEmailEx = function(uid, title, content, diamond, coupon, cb){
    var emailID = Date.now().toString() + utils.getRandomNum(1000, 9999);
    var server = dispatch.dispatch(uid, pomelo.app.getServersByType('hall'));
    rpcAPI.sendSingleEmail(server.id, emailID, uid, title, content, diamond, coupon, function(err){
        if (!!err){
            console.error('sendSingleEmail err:' + err);
            cb(err);
        }else{
            cb();
        }
    });
};
