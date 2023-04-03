var proto = module.exports;

// 百人牛牛协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_POURGOLD_NOTIFY			= 301;		// 下注通知
proto.GAME_POURGOLD_PUSH			= 401;		// 下注推送

//-----------------------------游戏状态----------------------------------------
proto.GAME_START_PUSH		        = 402;		// 游戏开始通知(下注)
proto.GAME_RESULT_PUSH				= 403;		// 游戏结果推送

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
    NONE: 0,
    GAME_STARTED: 1,
    GAME_END: 2
};

//-----------------------------牛牛种类----------------------------------------
proto.cardType = {
    NIU_1: 1,
    NIU_2: 2,
    NIU_3: 3,
    NIU_4: 4,
    NIU_5: 5,
    NIU_6: 6,
    NIU_7: 7,
    NIU_8: 8,
    NIU_9: 9,
    NIU_NIU: 10,
    SI_HUA_NIU: 11,
    WU_HUA_NIU: 12,
    ZHA_DAN_NIU: 13,
    WU_XIAO_NIU: 14
};

//-----------------------------时间状态----------------------------------------
proto.BET_TIME                      = 15;       // 下注时间
proto.SHOW_CARD_TIME                = 4;        // 开牌中
proto.PAI_JIANG_TIME                = 6;        // 派奖中
proto.XIU_XI_TIME                   = 5;        // 休息中

// 总时间
proto.SHOW_RESULT_TIME = proto.SHOW_CARD_TIME + proto.PAI_JIANG_TIME + proto.XIU_XI_TIME;

//-----------------------------下注方位----------------------------------------
proto.TIAN							= 0;		// 天
proto.DI							= 1;		// 地
proto.XUAN							= 2;		// 选
proto.HUANG                         = 3;        // 黄

// 下注推送
proto.gameStartPush = function(drawID) {
	return {
		type: this.GAME_START_PUSH,
		data: {
            drawID: drawID
        }
	};
};

// 游戏结果推送
proto.gameResultPush = function(scoreChangeArr, allCardDataArr, winTimesArr, cardTypeArr) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
            allCardDataArr: allCardDataArr,
            scoreChangeArr: scoreChangeArr,
            winTimesArr: winTimesArr,
            cardTypeArr: cardTypeArr
		}
	};
};

// 下注通知
proto.gameUserBetNotify = function (betInfoArr) {
    return {
        type: this.GAME_POURGOLD_NOTIFY,
        data: {
            betInfoArr: betInfoArr
        }
    };
};

// 下注通知
proto.gameUserBetPush = function (uid, betInfoArr) {
    return {
        type: this.GAME_POURGOLD_PUSH,
        data: {
            uid: uid,
            betInfoArr: betInfoArr
        }
    };
};