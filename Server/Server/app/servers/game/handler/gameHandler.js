/**
 * Created by zjgame on 2017/2/24.
 */
var code = require('../../../constant/code');
var async = require('async');
var rpcAPI = require('../../../API/rpcAPI');
var dispatch = require('../../../util/dispatcher');
var userInfoServices = require('../../../services/userInfoServices');
var enumeration = require('../../../constant/enumeration');
var utils = require('../../../util/utils');

module.exports = function(app) {
    return new Handler(app);
};

var Handler = function(app) {
    this.app = app;
    this.mgr = app.roomManager;
};

Handler.prototype.roomMessageNotify = function (msg, session, next){
    var curRoomID = session.get('roomID');
    var self = this;
    async.waterfall([
        function(cb){
            if (!session.uid){
                cb(code.INVALID_UERS);
            } else if (!curRoomID){
                cb(code.REQUEST_DATA_ERROR);
            }else{
                cb();
            }
        },
        function (cb) {
            var roomFrame = self.mgr.getRoomFrameByID(curRoomID);

            if (!roomFrame){
                cb(code.REQUEST_DATA_ERROR);
            }
            else {
                roomFrame.receiveRoomMessage(session.uid, msg);
                cb();
            }
        }
    ],function (err) {
        if (!!err) {
            console.error('roomMessageNotify error:' + err);
        }
        next();
    });
};

Handler.prototype.gameMessageNotify = function (msg, session, next){
    var curRoomID = session.get('roomID');
    var self = this;
    async.waterfall([
        function(cb){
            if (!session.uid){
                cb(code.INVALID_UERS);
            }else if (!curRoomID){
                cb(code.REQUEST_DATA_ERROR);
            }else{
                cb();
            }
        },
        function (cb) {
            var roomFrame = self.mgr.getRoomFrameByID(curRoomID);

            if (!roomFrame){
                cb(code.REQUEST_DATA_ERROR);
            }
            else {
                roomFrame.receiveGameMessage(session.uid, msg);
                cb();
            }
        }
    ],function (err) {
        if (!!err) {
            console.error('gameMessageNotify error:' + err)
        }
        next();
    });
};
