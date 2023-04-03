/**
 * Created by 1718841401 on 2017/6/22.
 */

var async = require('async');
var code = require('../../../constant/code');
var userInfoServices = require('../../../services/userInfoServices');
var dao = require('../../../dao/commonDao');
var utils = require('../../../util/utils');
var logger = require('pomelo-logger').getLogger('pomelo');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
};

Handler.prototype.getTodayWinGoldCountRankRequest = function(msg, session, next){
    next(null, {code: code.OK, msg: {rankList: []}});
    /*let user = this.app.hallManager.getUserByUid(session.uid);
    if(!user){
        next(null, {code: code.INVALID_UERS});
    }else{
        next(null, {code: code.OK, msg: {rankList: []}});//this.app.hallManager.getRankListData(msg.startIndex, msg.count)}})
    }*/
};
