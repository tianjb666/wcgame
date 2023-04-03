var code = require('../../../constant/code');
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
    if(!session.uid){
        next(null, {code: code.INVALID_UERS});
    }else{
        next(null, {code: code.OK, msg: {rankList: this.app.hallManager.getRankListData(msg.startIndex, msg.count)}})
    }
};