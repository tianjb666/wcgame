let proto = module.exports;

// BlackJack协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_USER_BET_NOTIFY			        = 301;		// 玩家下注通知
proto.GAME_USER_BET_PUSH    			    = 401;		// 玩家下注推送

proto.GAME_USER_CUT_CARD_NOTIFY			    = 302;		// 玩家分牌通知
proto.GAME_USER_CUT_CARD_PUSH    			= 402;		// 玩家分牌推送

proto.GAME_USER_DOUBLE_BET_NOTIFY			= 303;		// 玩家双倍通知
proto.GAME_USER_DOUBLE_BET_PUSH    			= 403;		// 玩家双倍推送

proto.GAME_USER_ADD_CARD_NOTIFY			    = 304;		// 玩家加牌通知
proto.GAME_USER_ADD_CARD_PUSH    			= 404;		// 玩家加牌推送

proto.GAME_USER_STOP_CARD_NOTIFY			= 305;		// 玩家停牌通知
proto.GAME_USER_STOP_CARD_PUSH    			= 405;		// 玩家停牌推送

proto.GAME_USER_BUY_INSURANCE_NOTIFY		= 309;		// 玩家购买保险通知
proto.GAME_USER_BUY_INSURANCE_PUSH    		= 409;		// 玩家购买保险推送

//-----------------------------游戏状态----------------------------------------
proto.GAME_START_PUSH                       = 406;      // 游戏开始推送
proto.GAME_SEND_CARD_PUSH   				= 407;		// 游戏发牌推送
proto.GAME_END_PUSH				            = 408;		// 游戏结果推送
proto.GAME_INSURANCE_RESULT_PUSH		    = 410;		// 游戏保险结果推送

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
    NONE: 0,
    WAIT_BET: 1,
    PLAYING: 2,
    WAIT_BUY_INSURANCE: 3
};

//-----------------------------时间状态----------------------------------------
proto.OPERATION_TIME                = 15;        // 操作时间
proto.NEXT_ROUND_TIME               = 15;        // 显示结果的时间

proto.chipAmount = [1, 10, 50, 100, 500];        // 筹码数额

proto.CHIP_NUMBER = {
    "btc": [0.00005, 0.0005, 0.0025, 0.005, 0.02],
    "ida": [2, 20, 100, 200, 1000],
    "usdt": [1, 10, 50, 100, 500],
    "lbcn": [1, 10, 50, 100, 500],
    "eth": [0.001, 0.01, 0.05, 0.1, 0.5],
    "eos": [0.05, 0.5, 2.5, 5, 25],
    "vtt": [1, 10, 50, 100, 500],
};

proto.gameStartPush = function (playingStatusArr) {
    return {
        type: this.GAME_START_PUSH,
        data: {
            playingStatusArr: playingStatusArr
        }
    };
};

proto.gameUserBetNotify = function (count) {
    return{
        type: this.GAME_USER_BET_NOTIFY,
        data:{
            count: count
        }
    };
};

proto.gameUserBetPush = function (chairID, count) {
    return{
        type: this.GAME_USER_BET_PUSH,
        data:{
            chairID: chairID,
            count: count
        }
    };
};

proto.gameSendCardPush = function (bankerCardArr, userCardArr) {
    return {
        type: this.GAME_SEND_CARD_PUSH,
        data: {
            bankerCardArr: bankerCardArr,
            userCardArr: userCardArr
        }
    };
};


proto.gameUserCutCardNotify = function () {
    return{
        type: this.GAME_USER_CUT_CARD_NOTIFY,
        data:{}
    };
};

proto.gameUserCutCardPush = function (chairID, userCardArr) {
    return{
        type: this.GAME_USER_CUT_CARD_PUSH,
        data:{
            chairID: chairID,
            userCardArr: userCardArr
        }
    };
};

proto.gameUserDoubleBetNotify = function (index) {
    return{
        type: this.GAME_USER_DOUBLE_BET_NOTIFY,
        data:{
            index: index
        }
    };
};

proto.gameUserDoubleBetPush = function (chairID, index, userCardArr) {
    return{
        type: this.GAME_USER_DOUBLE_BET_PUSH,
        data:{
            chairID: chairID,
            index: index,
            userCardArr: userCardArr
        }
    };
};

proto.gameUserAddCardNotify = function (index) {
    return{
        type: this.GAME_USER_ADD_CARD_NOTIFY,
        data:{
            index: index
        }
    };
};

proto.gameUserAddCardPush = function (chairID, index, userCardArr) {
    return{
        type: this.GAME_USER_ADD_CARD_PUSH,
        data:{
            index: index,
            chairID: chairID,
            userCardArr: userCardArr
        }
    };
};

proto.gameUserStopCardNotify = function (index) {
    return{
        type: this.GAME_USER_STOP_CARD_NOTIFY,
        data:{
            index: index
        }
    };
};

proto.gameUserStopCardPush = function (chairID, index) {
    return{
        type: this.GAME_USER_STOP_CARD_PUSH,
        data:{
            index: index,
            chairID: chairID
        }
    };
};

// 游戏结果推送
proto.gameResultPush = function(bankerCardArr, allCardArr, scoreChangeArr) {
	return {
		type: this.GAME_END_PUSH,
		data: {
            bankerCardArr: bankerCardArr,
            allCardArr: allCardArr,
            scoreChangeArr: scoreChangeArr
		}
	};
};

proto.gameUserByInsuranceNotify = function (isBuy) {
    return{
        type: this.GAME_USER_BUY_INSURANCE_NOTIFY,
        data:{
            isBuy: isBuy
        }
    };
};

proto.gameUserByInsurancePush = function (chairID, isBuy) {
    return{
        type: this.GAME_USER_BUY_INSURANCE_PUSH,
        data:{
            chairID: chairID,
            isBuy: isBuy
        }
    };
};

proto.gameInsuranceResultPush = function() {
    return {
        type: this.GAME_INSURANCE_RESULT_PUSH,
        data: {
        }
    };
};