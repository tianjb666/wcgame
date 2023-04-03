var request = require('request');
var code = require('../constant/code');
var service = module.exports;
var utils = require('../util/utils');

service.httpGet = function(url, cb){
    console.log('发送GET请求' + url);
    request(url, function(err, response, body){
        if (!!err || response.statusCode  !== 200){
            console.error('send http get request err:' + url);
            cb(code.FAIL);
        }else{
            console.log('收到GET数据', body);
            cb(null, body);
        }
    });
};

service.httpPost = function(url, requestData, cb){
    console.log('发送POST请求', url);
    console.log('POST参数', requestData);
    request({
        url: url,
        method:'POST',
        json: true,
        headers: {
            "content-type": "application/json",
            ///"CONTENT-TYPE": "application/x-www-form-urlencoded"
        },
        body: requestData
    }, function(err, response, body){
        if (!!err || response.statusCode  !== 200){
            console.error('send http post request err:' + url);
            utils.invokeCallback(cb, code.FAIL);
        }else{
            console.log('收到POST数据', body);
            utils.invokeCallback(cb, null, body);
        }
    });
};