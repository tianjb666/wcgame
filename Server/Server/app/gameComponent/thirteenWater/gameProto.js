var proto = module.exports;

proto.enumRule = {
	youSanChuan:		1,
	heiTaoA:			2,
	caoShi:				4,
	roomOwnerPay:		8,
	allPlayerPay:		16,
	bureau6:			32,
	bureau12:			64,
	bureau18:			128
};

proto.gameStatus = {
	NOT_START:		0,
	PLAYING:		1
};

proto.code = {
	'1': '非法请求数据'
};

proto.GAME_PREPARE_PUSH				= 402;

proto.GAME_CARDS_PUSH				= 403;

proto.GAME_CARDS_SORT_REQUEST		= 304;
proto.GAME_CARDS_SORT_PUSH			= 404;

proto.GAME_RESOUT_PUSH				= 405;
proto.GAME_END_PUSH					= 406;	/* 游戏结束时总结算推送 */

proto.GAME_CARDS_NOSORT_REQUEST		= 307;	/* 免摆牌 */
proto.GAME_CARDS_NOSORT_PUSH		= 407;


/* 游戏状态 */
proto.GAME_STATUS_NOTSTART			= 0;
proto.GAME_STATUS_GAMEING			= 1;
proto.GAME_STATUS_SETTLE			= 2;

/* 每种状态时间 */
proto.SORT_CARDS_TM					= 100;

proto.getGamePreparePushData = function(gameStatus, tm) {
	return {
		type: this.GAME_PREPARE_PUSH,
		data: {
			gameStatus: gameStatus,
			gamePrepareTm: tm
		}
	};
};

proto.getGameStatusPushData = function(gameStatus) {
	return {
		type: proto.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tm: Date.now()
		}
	};
};

/* 推送游戏牌数据 */
proto.getGameCardsPushData = function(cardsArr, playingChairArr) {
	return {
		type: this.GAME_CARDS_PUSH,
		data: {
			cardsArr: cardsArr,
            playingChairArr: playingChairArr
		}
	};
};

proto.getGameCardsSortRequestData = function(cardArr, tm) {
	return {
		type: this.GAME_CARDS_SORT_REQUEST,
		data: {
			cardArr: cardArr,
			tm: tm
		}
	};
};

proto.getGameCardsSortPushData = function(code, chairId, cardArr) {
	return {
		type: this.GAME_CARDS_SORT_PUSH,
		code: code,
		data: { 
			chairId: chairId,
			cardArr: cardArr 
		}
	};
};

proto.getGameResoutPushData = function(resout, gameStatus) {
	return {
		type: this.GAME_RESOUT_PUSH,
		data: {
			resout: resout,
			gameStatus: gameStatus
		}
	};
};

proto.getGameEndPushData = function(resout) {
	return {
		type: this.GAME_END_PUSH,
		data: {
			resout: resout
		}
	};
};

proto.getGameNosortRequestData = function(isNosort, tm) {
	return {
		type: this.GAME_CARDS_NOSORT_REQUEST,
		data: { 
			isNosort: isNosort,
			tm: tm
		}
	};
};

proto.getGameNosortPushData = function(chairId, isNosort) {
	return {
		type: this.GAME_CARDS_NOSORT_PUSH,
		data: { 
			chairId: chairId,
			isNosort: isNosort 
		}
	};
};

