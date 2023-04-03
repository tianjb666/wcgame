/**
 * author: caolinye		date: 2018/3/19
 */
var proto = module.exports;

proto.POUR_GOLD_NOTIFY			= 301;		// 下注
proto.POUR_GOLD_PUSH			= 401;		

proto.RESOUT_PUSH				= 402;		// 结果

proto.STATUS_PUSH				= 403;		// 状态变化

proto.STATUS_NONE				= 0;		// 
proto.STATUS_POUR				= 1;		// 下注状态
proto.STATUS_RESOUT				= 2;		// 结算状态(停止下注)

proto.POUR_TM					= 20;		// 下注时间
proto.RESOUT_TM					= 20;		// 结果时间


/*
 * 下注通知
 */
proto.getPourGoldNotifyData = function(direction, gold) {
	return {
		type: this.POUR_GOLD_NOTIFY,
		data: { 
			direction: direction, 
			gold: gold
		}
	};
};

/*
 * 下注回复
 */
proto.getPourGoldPushData = function(direction, gold, uid) {
	return {
		type: this.POUR_GOLD_PUSH,
		data: { 
			direction: direction, 
			gold: gold,
			uid: uid
		}
	};
};

/*
 * 结果推送
 */
proto.getResoutPushData = function(resout) {
	return {
		type: this.RESOUT_PUSH,
		data: { 
			resout: resout
		}
	};
};

/*
 * 状态推送
 */
proto.getStatusPushData = function(gameStatus) {
	return {
		type: this.STATUS_PUSH,
		data: {
			gameStatus: gameStatus
		}
	};
};
