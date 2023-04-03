var fs = require('node-fs');
var async = require('async');
var express = require('express');
var router = express.Router();
var utils = require('../util/utils');
var code = require('../constant/code');

var formidable = require('formidable');

var cacheFolder = 'uploadcache/';
router.post('/uploadImage', function(req, res, next) {
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public/' + cacheFolder;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小

    form.parse(req, function(err, fields, files) {

        if (err) {
            res.locals.error = err;
            res.send({code: 1});
            return;
        }
        console.log(files);
        if (!files || !files.file){
            res.send([]);
            return;
        }

        var extName = '';  //后缀名
        switch (files.file.type) {
            case 'image/pjpeg':
                extName = 'jpg';
                break;
            case 'image/jpeg':
                extName = 'jpg';
                break;
            case 'image/png':
                extName = 'png';
                break;
            case 'image/x-png':
                extName = 'png';
                break;
        }

        if(extName.length === 0){
            res.send({code: code.FAIL});
            return;
        }

        var avatarName = Date.now() + "" + utils.getRandomNum(1000, 9999) + '.' + extName;
        //图片写入地址；
        var newPath = form.uploadDir + avatarName;
        //显示地址；
        console.log("newPath",newPath);
        fs.renameSync(files.file.path, newPath);  //重命名
        res.send([cacheFolder + avatarName]);
    });
});

router.post('/deleteFiles', function(req, res, next) {
	var deleteList = !!req.body.resList? JSON.parse(req.body.resList):[];
	for (var i = 0; i < deleteList.length; ++i){
		fs.unlink("public/" + deleteList[i],function(err){
			if (!!err){
				console.error('删除图片失败');
			}
		});
	}
	res.send('OK');
});

module.exports = router;
