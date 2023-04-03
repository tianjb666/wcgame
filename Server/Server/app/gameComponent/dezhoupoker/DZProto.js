let proto = module.exports;

// 德州扑克协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_USER_BET_NOTIFY			        = 301;		// 玩家下注通知
proto.GAME_USER_BET_PUSH    			    = 401;		// 玩家下注推送

proto.GAME_USER_GIVE_UP_NOTIFY              = 302;      // 玩家弃牌通知
proto.GAME_USER_GIVE_UP_PUSH                = 402;      // 玩家弃牌推送

//-----------------------------游戏状态----------------------------------------
proto.GAME_START_PUSH                       = 406;      // 游戏开始推送
proto.GAME_SEND_CARD_PUSH          		    = 407;		// 游戏发牌推送
proto.GAME_END_PUSH				            = 408;		// 游戏结果推送
proto.GAME_USER_UPDATE_TAKE_GOLD_PUSH       = 409;      // 玩家更新带入金币

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
    NONE: 0,
    PLAYING: 1
};

//-----------------------------玩家状态----------------------------------------
proto.userStatus = {
    NONE: 0,
    PLAYING: 1,
    GIVE_UP: 2
};

//--------------------------------牌型----------------------------------------
proto.cardType = {
    SINGLE: 1,
    ONE_DOUBLE: 2,
    TWO_DOUBLE: 3,
    THREE: 4,
    SHUN_ZI: 5,
    TONG_HUA: 6,
    HU_LU: 7,
    TIE_ZHI: 8,
    TONG_HUA_SHUN: 9,
    KING_TONG_HUA_SHUN: 10
};

//--------------------------------赢的类型--------------------------------------
proto.winType = {
    ONLY_ONE: 1,            // 其他人都弃牌，只剩一个玩家
    MAX_CARD: 2             // 最终比牌最大
};

//--------------------------------操作类型--------------------------------------
proto.operationType = {
    NONE: 0,
    ADD_BET: 1,         // 加注
    FLOW: 2,            // 跟注
    PASS: 3,            // 过牌
    GIVE_UP: 4,         // 弃牌
    ALL_IN: 5           // allin
};

//-----------------------------时间状态----------------------------------------
proto.OPERATION_TIME                = 15;        // 操作时间
proto.NEXT_ROUND_TIME               = 15;        // 显示结果的时间

proto.gameStartPush = function (bankerUserChairID, selfCardArr, nextUserChairID, maxBetCount, betCountArr, userStatusArr, drawID) {
    return {
        type: this.GAME_START_PUSH,
        data: {
            bankerUserChairID: bankerUserChairID,
            nextUserChairID: nextUserChairID,
            maxBetCount: maxBetCount,
            selfCardArr: selfCardArr,
            betCountArr: betCountArr,
            userStatusArr: userStatusArr,
            drawID: drawID
        }
    };
};

/**
 * count: 0表示让牌，-1表示全押，其他为正常下注
 */
proto.gameUserBetNotify = function (count) {
    return{
        type: this.GAME_USER_BET_NOTIFY,
        data:{
            count: count
        }
    };
};

proto.gameUserBetPush = function (chairID, count, curTurnTotalBetCount, nextUserChairID, curBetCount, maxBetCount, operationType) {
    return{
        type: this.GAME_USER_BET_PUSH,
        data:{
            chairID: chairID,
            count: count,
            curTurnTotalBetCount: curTurnTotalBetCount,
            nextUserChairID: nextUserChairID,
            curBetCount: curBetCount,
            maxBetCount: maxBetCount,
            operationType: operationType
        }
    };
};

proto.gameSendPublicCardPush = function (cardDataArr, nextUserChairID, curBetCount, maxBetCount, totalBetCount) {
    return {
        type: this.GAME_SEND_CARD_PUSH,
        data: {
            cardDataArr: cardDataArr,
            nextUserChairID: nextUserChairID,
            curBetCount: curBetCount,
            maxBetCount: maxBetCount,
            totalBetCount: totalBetCount
        }
    };
};


proto.gameUserGiveUpNotify = function () {
    return{
        type: this.GAME_USER_GIVE_UP_NOTIFY,
        data:{}
    };
};

proto.gameUserGiveUpPush = function (chairID, nextUserChairID, curBetCount, maxBetCount) {
    return{
        type: this.GAME_USER_GIVE_UP_PUSH,
        data:{
            chairID: chairID,
            nextUserChairID: nextUserChairID,
            curBetCount: curBetCount,
            maxBetCount: maxBetCount
        }
    };
};

// 游戏结果推送
proto.gameResultPush = function(allUserCardArr, scoreChangeArr, winChairIDArr, winType, showPublicCardArr, totalBetCount) {
	return {
		type: this.GAME_END_PUSH,
		data: {
            allUserCardArr: allUserCardArr,
            winChairIDArr: winChairIDArr,
            scoreChangeArr: scoreChangeArr,
            winType: winType,
            showPublicCardArr: showPublicCardArr,
            totalBetCount: totalBetCount
		}
	};
};

// 更新玩家带入金币
proto.gameUserUpdateTakeGoldPush = function (chairID, newTakeGold) {
    return {
        type: this.GAME_USER_UPDATE_TAKE_GOLD_PUSH,
        data: {
            chairID: chairID,
            takeGold: newTakeGold
        }
    }
};