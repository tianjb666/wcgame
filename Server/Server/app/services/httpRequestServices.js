/**
 * Created by 1718841401 on 2017/8/31.
 */
var request = require('request');
var code = require('../constant/code');
var xml2js = require('xml2js');
var service = module.exports;

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
            // "content-type": "application/json",
            "CONTENT-TYPE": "application/x-www-form-urlencoded"
        },
        body: JSON.stringify(requestData)
    }, function(err, response, body){
        if (!!err || response.statusCode  !== 200){
            console.error('send http post request err:' + url);
            cb(code.FAIL);
        }else{
            console.log('收到POST数据', body);
            cb(null, body);
        }
    });
};

service.httpPostXml = function (url, requestData, cb) {
    var builder = new xml2js.Builder();  // JSON->xml
    var requestXmlData = builder.buildObject(JSON.stringify(requestData));

    console.log('发送POSTxml请求', url);
    console.log('POSTxml参数', requestData);

    request({
        url: url,
        method:'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Content-Length': requestXmlData.length
        },
        body: requestXmlData
    }, function(err, response, body){
        var parser = new xml2js.Parser();   //xml -> json
        var data = parser.parseString(body);
        console.log(data);

        if (!!err || response.statusCode !== 200){
            console.error('send http post request err:' + url, body);
            cb(code.FAIL);
        }else{
            console.log('收到POSTxml数据', body);
            cb(null, body);
        }
    });
};
