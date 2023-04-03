var express = require('express');
var router = express.Router();

/*
电话：400-187-6838
手机：13682427674 (WX)
QQ: 1718841401
武汉神彩信息技术有限公司  http://nmi.cn/（简称神彩）成立于2016年，是一家集研发、运营和销售为一体的网络彩票软件开发商与运营商。
*/

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
