var proto = module.exports;

//游戏状态
proto.GAME_STATUS_PLAYING = 1;//游戏正在进行

proto.USER_READY_NOTIFY =                   301;            // 用户准备的通知
proto.USER_READY_PUSH =                     401;            // 用户准备的推送

proto.OTHER_USER_ENTRY_ROOM_PUSH =          402;            // 用户进入房间的推送

proto.USER_LEAVE_ROOM_NOTIFY =              303;            // 用户离开房间的通知
proto.USER_LEAVE_ROOM_RESPONSE =			403;            // 用户离开房间的回复
proto.USER_LEAVE_ROOM_PUSH =                404;			// 用户离开房间推送

proto.ROOM_DISMISS_PUSH =                   405;            // 房间解散的推送

proto.ROOM_USER_INFO_CHANGE_PUSH =          406;            // 房间用户信息变化的推送

proto.USER_CHAT_NOTIFY =                    307;            // 用户聊天通知
proto.USER_CHAT_PUSH =                      407;            // 用户聊天推送

proto.USER_OFF_LINE_PUSH =                  408;            // 用户掉线的推送

proto.ROOM_DRAW_FINISHED_PUSH =             409;            // 开设的房间局数用完推送

proto.ROOM_NOTICE_PUSH =                    410;            // 房间提示推送

proto.GAME_WIN_RATE_NOTIFY =				311;
proto.GAME_WIN_RATE_PUSH =					411;

proto.USER_RECONNECT_NOTIFY =				312;			// 玩家断线重连
proto.USER_RECONNECT_PUSH	 =				412;

proto.ASK_FOR_DISMISS_NOTIFY =				313;			// 玩家请求解散房间
proto.ASK_FOR_DISMISS_PUSH =				413;

proto.GAME_END_PUSH	=						414;			// 最终结果推送

proto.SORRY_I_WILL_WIN_NOTIFY =             415;            // 对不起，这局我要赢

proto.ASK_FOR_DISMISS_STATUS_NOTIFY	=		316;			// 获取当前请求解散状态
proto.ASK_FOR_DISMISS_STATUS_PUSH	=		416;

proto.GET_ROOM_SHOW_USER_INFO_NOTIFY =      317;            // 获取房间需要显示的玩家信息通知
proto.GET_ROOM_SHOW_USER_INFO_PUSH =        417;            // 获取房间需要显示的玩家信息推送

proto.GET_ROOM_SCENE_INFO_NOTIFY =          318;            // 获取房间场景信息的通知
proto.GET_ROOM_SCENE_INFO_PUSH =            418;            // 获取房间场景信息的推送

proto.GET_ROOM_ONLINE_USER_INFO_NOTIFY =    319;            // 获取房间在线用户信息的通知
proto.GET_ROOM_ONLINE_USER_INFO_PUSH =      419;            // 获取房间在线用户信息的推送

proto.EXIT_WAIT_SECOND						= 30;
proto.NOANSWER_WAIT_SECOND					= 120;
proto.ANSWER_EXIT_SECOND					= 30;

proto.userStatusEnum = {		// 玩家状态
    NONE:			0,
    READY:			1,
    PLAYING:		2,
    OFFLINE:		4
};

proto.IWillWinNotify = function () {
    return {
        type: proto.SORRY_I_WILL_WIN_NOTIFY,
        data: {}
    }
};

proto.selfEntryRoomPush = function (roomUserInfoArr, gameData, kindId, roomID, drawID){
    return {
        roomUserInfoArr: roomUserInfoArr,
        gameData: gameData,
        kindId: kindId,
        roomID: roomID,
        drawID: drawID
    }
};

proto.roomMessagePush = function (msg){
    return msg;
};

proto.userChatNotify = function (chatData) {
    return {
        type: proto.USER_CHAT_NOTIFY,
        data:{
            chatData: chatData
        }
    }
};

proto.userChatPush = function (chairId, chatData) {
    return {
        type: proto.USER_CHAT_PUSH,
        data:{
            chairId: chairId,
            chatData: chatData
        }
    }
};

proto.userReadyNotify = function (isReady){
    return {
        type: proto.USER_READY_NOTIFY,
        data: {
            isReady:isReady
        }
    }
};

proto.userReadyPush = function (chairId){
    return {
        type: proto.USER_READY_PUSH,
        data: {
            chairId:chairId
        }
    }
};

proto.otherUserEntryRoomPush = function (roomUserInfo){
    return {
        type: proto.OTHER_USER_ENTRY_ROOM_PUSH,
        data: {
            roomUserInfo: roomUserInfo
        }
    }
};

proto.userLeaveRoomNotify = function (){
    return {
        type: proto.USER_LEAVE_ROOM_NOTIFY,
        data: {}
    }
};

proto.userLeaveRoomResponse = function (chairId){
    return {
        type: proto.USER_LEAVE_ROOM_RESPONSE,
        data: {
            chairId: chairId
        }
    }
};

proto.userLeaveRoomPush = function (roomUserInfo){
    return {
        type: proto.USER_LEAVE_ROOM_PUSH,
        data: {
            roomUserInfo: roomUserInfo
        }
    }
};

proto.roomDismissReason = {
    RDR_NONE:				    0,	/* 正常结束 */
    RDR_OWENER_ASK:				1,	/* 未开始游戏,房主解散 */
    RDR_USER_ASK:				2,	/* 游戏中,请求结束 */
    RDR_TIME_OUT:				4	/* 超时未响应 */
};

proto.roomDismissPush = function (roomDismissReason){
    return {
        type: proto.ROOM_DISMISS_PUSH,
        data: {
            reason: roomDismissReason
        }
    }
};

proto.userInfoChangePush = function (changeInfo) {
    return {
        type: proto.ROOM_USER_INFO_CHANGE_PUSH,
        data: {
            changeInfo: changeInfo
        }
    }
};

/*
proto.userRequestDismissRoomNotify = function (){
    return {
        type: proto.USER_REQUEST_DISMISS_ROOM_NOTITY,
        data: {}
    };
};

proto.userRequestDismissRoomPush = function (chairId){
    return {
        type: proto.USER_REQUEST_DISMISS_ROOM_PUSH,
        data:{
            requestchairId: chairId
        }
    }
};

proto.userResponseDismissRoomNotify = function (isAgree){
    return {
        type: proto.USER_RESPONSE_DISMISS_ROOM_NOTIFY,
        data: {
            isAgree: isAgree
        }
    }
};

proto.userResponseDismissRoomPush = function (isAgree){
    return {
        type: proto.USER_RESPONSE_DISMISS_ROOM_PUSH,
        data:{
            isAgree: isAgree
        }
    }
};
*/

proto.userOffLinePush = function (chairId){
    return {
        type: proto.USER_OFF_LINE_PUSH,
        data: { chairId: chairId }
    }
};

proto.roomDrawFinished = function (allDrawScoreRecord){
    return {
        type: proto.ROOM_DRAW_FINISHED_PUSH,
        data: {
            allDrawScoreRecord:allDrawScoreRecord
        }
    }
};

proto.getGameWinRateNotifyData = function(rate) {
    return {
        type: this.GAME_WIN_RATE_NOTIFY,
        data: { rate: rate }
    };
};

proto.getGameWinRatePushData = function() {
    return {
        type: this.GAME_WIN_RATE_PUSH,
        data: { }
    }
};

// 游戏规则格式
proto.getGameRule = function(bureau, isOwnerPay, memberCount, diamondCost, gameType, otherRule) {
    return {
        bureau: bureau,				//局数
        isOwnerPay: isOwnerPay,		//是否房主支付
        memberCount: memberCount,	//房间人数
        diamondCost: diamondCost,	//房卡
        gameType: gameType,			//游戏类型
        otherRule: otherRule		//游戏中特殊规则
    };
};

proto.getUserReconnectNotifyData = function() {
    return {
        type: this.USER_RECONNECT_NOTIFY,
        data: { }
    };
};

proto.getUserReconnectPushData = function(gameData) {
    return {
        type: this.USER_RECONNECT_PUSH,
        data: {
            gameData: gameData
        }
    };
};

proto.getAskForDismissNotifyData = function(isExit) {
    return {
        type: this.ASK_FOR_DISMISS_NOTIFY,
        data: {
            isExit: isExit
        }
    };
};

proto.getAskForDismissPushData = function(chairIdArr, nameArr, scoreArr, tm, chairId) {
    return {
        type: this.ASK_FOR_DISMISS_PUSH,
        data: {
            nameArr: nameArr,
            scoreArr: scoreArr,
            chairIdArr: chairIdArr,
            tm: tm,
            askChairId: chairId
        }
    };
};

// 游戏总结算推送
proto.getGameEndPushData = function(resout) {
    return {
        type: this.GAME_END_PUSH,
        data: {
            resout: resout
        }
    };
};

proto.getAskDismissStatusNotifyData = function() {
    return {
        type: this.ASK_FOR_DISMISS_STATUS_NOTIFY,
        data: { }
    };
};

proto.getAskDismissStatusPushData = function(isOnDismiss) {
    return {
        type: this.ASK_FOR_DISMISS_STATUS_PUSH,
        data: { 
			isOnDismiss: isOnDismiss
		}
    };
};

proto.getRoomShowUserInfoNotify = function () {
    return {
        type: proto.GET_ROOM_SHOW_USER_INFO_NOTIFY,
        data:{}
    }
};

proto.getRoomShowUserInfoPush = function (selfUserInfo, shenSuanZiInfo, fuHaoUserInfoArr) {
    return {
        type: proto.GET_ROOM_SHOW_USER_INFO_PUSH,
        data:{
            selfUserInfo: selfUserInfo,
            shenSuanZiInfo: shenSuanZiInfo,
            fuHaoUserInfoArr: fuHaoUserInfoArr
        }
    }
};

proto.getRoomSceneInfoNotify = function () {
    return {
        type: proto.GET_ROOM_SCENE_INFO_NOTIFY,
        data:{}
    }
};

proto.getRoomSceneInfoPush = function (roomUserInfoArr, gameData, roomID, drawID, gameTypeInfo) {
    return {
        type: proto.GET_ROOM_SCENE_INFO_PUSH,
        data:{
            roomUserInfoArr: roomUserInfoArr,
            gameData: gameData,
            roomID: roomID,
            drawID: drawID,
            gameTypeInfo: gameTypeInfo
        }
    }
};

proto.getRoomOnlineUserInfoNotify = function () {
    return {
        type: proto.GET_ROOM_ONLINE_USER_INFO_NOTIFY,
        data:{}
    }
};

proto.getRoomOnlineUserInfoPush = function (shenSuanZiInfo, fuHaoUserInfoArr) {
    return {
        type: proto.GET_ROOM_ONLINE_USER_INFO_PUSH,
        data:{
            shenSuanZiInfo: shenSuanZiInfo,
            fuHaoUserInfoArr: fuHaoUserInfoArr
        }
    }
};

