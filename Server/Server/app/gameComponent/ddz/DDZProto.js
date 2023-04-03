let proto = module.exports;

// 斗地主协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_SNATCH_LANDLORD_NOTIFY			= 301;		// 抢地主通知
proto.GAME_SNATCH_LANDLORD_PUSH			    = 401;		// 抢地主推送

proto.GAME_USER_OUT_CARD_NOTIFY             = 302;      // 用户出牌通知
proto.GAME_USER_OUT_CARD_PUSH               = 402;      // 用户出牌推送

proto.GAME_USER_PASS_NOTIFY                 = 303;      // 用户不出通知
proto.GAME_USER_PASS_PUSH                   = 403;      // 用户不出通知

//-----------------------------游戏状态----------------------------------------
proto.GAME_SEND_CARD_PUSH		            = 404;		// 游戏发牌推送
proto.GAME_START_PUSH                       = 405;      // 游戏开始推送
proto.GAME_RESULT_PUSH				        = 406;		// 游戏结果推送

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
    NONE: 0,
    SNATCH_LANDLORD: 1,
    OUT_CARD: 2,
    GAME_END: 3
};

//-----------------------------时间状态----------------------------------------
proto.SNATCH_LANDLORD_TIME          = 15;        // 叫地主时间
proto.OUT_CARD_TIME                 = 15;        // 显示结果的时间

proto.cardType = {
    ERROR: 0,                   // 错误
    SINGLE: 1,                  // 单牌
    DOUBLE: 2,                  // 对子
    THREE: 3,                   // 三张
    SINGLE_LINE: 4,             // 单连
    DOUBLE_LINE: 5,             // 对连
    THREE_LINE: 6,              // 三连
    THREE_LINE_TAKE_ONE: 7,     // 三带一张
    THREE_LINE_TAKE_TWO: 8,     // 三带一对
    FOUR_LINE_TAKE_ONE: 9,      // 四带两单
    FOUR_LINE_TAKE_TWO: 10,     // 四带两对
    BOMB_CARD: 11,              // 炸弹
    MISSILE_CARD: 12,           // 火箭

};

proto.gameSendCardPush = function (curChairID, selfCardArr) {
    return {
        type: this.GAME_SEND_CARD_PUSH,
        data: {
            curChairID: curChairID,
            selfCardArr: selfCardArr
        }
    };
};

proto.gameUserSnatchLandlordNotify = function (score) {
    return{
        type: this.GAME_SNATCH_LANDLORD_NOTIFY,
        data:{
            score: score
        }
    }
};

proto.gameUserSnatchLandlordPush = function (score, curChairID, chairID, curMaxScore) {
    return{
        type: this.GAME_SNATCH_LANDLORD_PUSH,
        data:{
            chairID: chairID,
            curChairID: curChairID,
            score: score,
            curMaxScore: curMaxScore
        }
    }
};

// 游戏开始推送
proto.gameStartPush = function(landChairID, landScore, backCardArr) {
	return {
		type: this.GAME_START_PUSH,
		data: {
		    landChairID: landChairID,
            landScore: landScore,
		    backCardArr: backCardArr
		}
	};
};

proto.gameUserOutCardNotify = function (outCardArr) {
    return {
        type: this.GAME_USER_OUT_CARD_NOTIFY,
        data: {
            outCardArr: outCardArr
        }
    }
};

proto.gameUserOutCardPush = function (chairID, curChairID, outCardArr, leftCardCount) {
    return {
        type: this.GAME_USER_OUT_CARD_PUSH,
        data: {
            chairID: chairID,
            curChairID: curChairID,
            outCardArr: outCardArr,
            leftCardCount: leftCardCount
        }
    }
};

proto.gameUserPassNotify = function () {
    return {
        type: this.GAME_USER_PASS_NOTIFY,
        data: {
        }
    }
};

proto.gameUserPassPush = function (chairID, curChairID, isNewTurn) {
    return {
        type: this.GAME_USER_PASS_PUSH,
        data: {
            chairID: chairID,
            curChairID: curChairID,
            isNewTurn: isNewTurn
        }
    }
};

// 游戏结果推送
proto.gameResultPush = function(allCardArr, scoreChangeArr, bombTimes, nicknameArr, isSpring, isLandWin) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
            allCardArr: allCardArr,
            scoreChangeArr: scoreChangeArr,
            bombTimes: bombTimes,
            nicknameArr: nicknameArr,
            isSpring: isSpring,
            isLandWin: isLandWin
		}
	};
};