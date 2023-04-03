let request = require('request');
let qr = require('qr-image');
let authServices = require('../../../services/authServices');
let pomelo = require('pomelo');
let code = require('../../../constant/code');

module.exports = function (app, http) {
    //转发客户端httpGet请求
    http.get('/httpGet', function(req, res){
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        let url = req.originalUrl;
        let num = url.indexOf('=');
        url = url.substr(num + 1);
        console.info(url);
        if (!url){
        }else{
            req.pipe(request(url)).pipe(res);
        }
    });

    //转发客户端httpPost请求
    http.post('/httpPost', function(req, res){
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        let url = req.originalUrl;
        let num = url.indexOf('=');
        url = url.substr(num + 1);
        console.info(url);
        if (!url){
        }else{
            req.pipe(request.post({url: url, body: req.body.params})).pipe(res);
        }
    });

    //获取带链接的二维码图片
    http.get('/getQRCodeImgWithUrl', function (req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        let webServerUrl = pomelo.app.get('publicParameter')["webServerUrl"];

        let uid = req.query.uid;

        let url = webServerUrl + "/web-spread/index.html?uid=" + uid;
        let qr_png = qr.image(url, {type: 'png'});
        res.setHeader("Content-Type", "image/png");
        qr_png.pipe(res);
    });

    // 发送验证码
    http.post('/getSMSCode', function (req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        authServices.sendSmsAuthCode(req.body.phoneNumber, function (err) {
            if (!!err){
                res.end(JSON.stringify({code: code.SMS_SEND_FAILED}));
            }else{
                res.end(JSON.stringify({code: code.OK}));
            }
        });
    });

    // 获取图形验证码
    http.get('/getImgCode', function (req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        let uniqueID = req.query.uniqueID;
        if (!!uniqueID){
            res.writeHead(200, {
                'Content-Type': 'image/png'
            });
            res.end(authServices.getImgAuthCode(uniqueID));
        }else{
            res.end();
        }
    });
};