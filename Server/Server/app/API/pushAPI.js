/**
 * Created by 1718841401 on 2017/6/23.
 */
var api = module.exports;
var pomelo = require('pomelo');

api.roomMessagePush = function(msg, uidAndFrontendIdArr, cb){
    var channelService = pomelo.app.get('channelService');
    msg.pushRouter = 'RoomMessagePush';
    channelService.pushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, cb);
};

api.gameMessagePush = function(msg, uidAndFrontendIdArr, cb){
    var channelService = pomelo.app.get('channelService');
    msg.pushRouter = 'GameMessagePush';
    channelService.pushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, cb);
};

api.selfEntryRoomPush = function(msg, uidAndFrontendIdArr, cb){
    var channelService = pomelo.app.get('channelService');
    msg.pushRouter = 'SelfEntryRoomPush';
    channelService.pushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, cb);
};

api.updateUserInfoPush = function(msg, uidAndFrontendIdArr, cb){
    var channelService = pomelo.app.get('channelService');
    msg.pushRouter = 'UpdateUserInfoPush';
    channelService.pushMessageByUids('ServerMessagePush', msg, uidAndFrontendIdArr, cb);
};

api.broadcastPush = function(msg, cb){
    var channelService = pomelo.app.get('channelService');
    msg.pushRouter = 'BroadcastPush';
    channelService.broadcast('connector', 'ServerMessagePush', msg, null, cb);
};

api.popDialogContentPush = function(msg, uidAndFrontendIdArr, cb){
    var channelService = pomelo.app.get('channelService');
    msg.pushRouter = 'PopDialogContentPush';
    channelService.pushMessageByUids('ServerMessagePush',msg, uidAndFrontendIdArr, cb);
};
