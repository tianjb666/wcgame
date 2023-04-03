let utils = require('../util/utils');
let pomelo = require('pomelo');
let code = require('../constant/code');
let cacheDataDao = require('../dao/cacheDataDao');
let logger = require('pomelo-logger').getLogger('pomelo');
let aliyunSmsServices = require('./aliyunSmsServices');
let captchapng = require('captchapng');

let CODE_TIME_OUT_TIME = 5 * 60 * 1000;

let services = module.exports;

services.sendSmsAuthCode = function(phone, cb) {
    // 获取短信配置信息
    let smsAuthConfig = pomelo.app.get('publicParameter')["smsAuthConfig"];
    if (!!smsAuthConfig) smsAuthConfig = JSON.parse(smsAuthConfig);

    if (!smsAuthConfig){
        utils.invokeCallback(cb, code.SMS_AUTH_CONFIG_ERROR);
        return;
    }
    if (!aliyunSmsServices.isInit){
        aliyunSmsServices.initAccessKey(smsAuthConfig.accessKeyId, smsAuthConfig.accessKeySecret);
    }
    let verificationCode = utils.getRandomNum(1000, 9999).toString();
    let data = {
        PhoneNumbers: phone,	                            //要发送到短信的手机
        SignName: smsAuthConfig.SignName,			            //短信签名，阿里云短信平台申请
        TemplateCode: smsAuthConfig.TemplateCode,		        //短信模板Code，阿里云短信平台申请
        TemplateParam: '{"code":"' + verificationCode +'"}'
    };
    aliyunSmsServices.sendRegistSms(data, function (err) {
        if (!!err){
            logger.error("sendSmsAuthCode sendRegistSms error:" + JSON.stringify(err));
            utils.invokeCallback(cb, code.SMS_SEND_FAILED);
        }else{
            cacheDataDao.setData("PHONE_AUTH_CODE_" + phone, verificationCode, CODE_TIME_OUT_TIME);
            utils.invokeCallback(cb);
        }

    });
};

services.authSmsCode = function (phone, authCode, cb) {
    cacheDataDao.getData("PHONE_AUTH_CODE_" + phone, function (err, value) {
        if (!!err || value !== authCode){
            utils.invokeCallback(cb, code.SMS_CODE_ERROR);
        }else{
            utils.invokeCallback(cb);
        }
    });
};

services.getImgAuthCode = function (uniqueID) {
    let verificationCode = utils.getRandomNum(1000, 9999).toString();
    let p = new captchapng(100,60,verificationCode);                // width,height,numeric captcha
    p.color(80, 80, 80, 255);                                        // First color: background (red, green, blue, alpha)
    p.color(255, 255, 255, 255);                                     // Second color: paint (red, green, blue, alpha)

    let img = p.getBase64();

    // 存储到缓存服务器，
    cacheDataDao.setData("IMG_AUTH_CODE_" + uniqueID, verificationCode, CODE_TIME_OUT_TIME);
    return new Buffer(img,'base64');
};

services.authImgCode = function (uniqueID, authCode, cb) {
    cacheDataDao.getData("IMG_AUTH_CODE_" + uniqueID, function (err, value) {
        if (!!err || value !== authCode){
            utils.invokeCallback(cb, code.IMG_CODE_ERROR);
        }else{
            utils.invokeCallback(cb);
        }
    });
};