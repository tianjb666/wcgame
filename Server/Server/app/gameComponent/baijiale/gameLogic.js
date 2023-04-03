/*
 * author: caolinye		date: 2018/3/19
 */
var gameLogic = module.exports;

gameLogic.COLOR_FANGKUAI	= 0;	// 方块
gameLogic.COLOR_CAOHUA		= 1;	// 草花
gameLogic.COLOR_HONGTAO		= 2;	// 红桃
gameLogic.COLOR_HEITAO		= 3;	// 黑桃

gameLogic.RATE_HE			= 8;	// 和
gameLogic.RATE_ZHUANG		= 1;	// 庄赢
gameLogic.RATE_XIAN			= 1;	// 闲赢
gameLogic.RATE_ZHUANGDUI	= 11;	// 庄对
gameLogic.RATE_XIANDUI		= 11;	// 闲对

gameLogic.WIN_HE			= 1;	// 赢-和
gameLogic.WIN_ZHUANG		= 2;	// 赢-庄赢
gameLogic.WIN_XIAN			= 4;	// 赢-闲赢
gameLogic.WIN_ZHUANGDUI		= 8;	// 赢-庄对
gameLogic.WIN_XIANDUI		= 16;	// 赢-闲对


/*
 * 获取牌
 */
gameLogic.getCards = function() {
	var cardArr = [], random;
	while(cardArr.length < 6) {
		random = Math.floor(Math.random()*52);
		if(cardArr.indexOf(random) < 0) {
			cardArr.push(random);
		}
	}
	var cardsArr = [[], []];
	cardsArr[0].push(cardArr.pop());
	cardsArr[0].push(cardArr.pop());
	cardsArr[1].push(cardArr.pop());
	cardsArr[1].push(cardArr.pop());
	var xianSum = (this.getCardCount(cardsArr[0][0])+this.getCardCount(cardsArr[0][1]))%10;
	var zhuangSum = (this.getCardCount(cardsArr[1][0])+this.getCardCount(cardsArr[1][1]))%10;
	if(xianSum <= 5) {
		cardsArr[0].push(cardArr.pop());
	}
	if(xianSum <= 6 && zhuangSum <= 6) {
		var card = this.getCardCount(cardsArr[0][1]);
		if(zhuangSum <= 2) {
			cardsArr[1].push(cardArr.pop());
		}
		else if(zhuangSum === 3 && (card !== 8)) {
			cardsArr[1].push(cardArr.pop());
		}
		else if(zhuangSum === 4 && (card !== 8 && card !== 9 && card !== 0)) {
			cardsArr[1].push(cardArr.pop());
		}
		else if(zhuangSum === 5 && (card === 4 || card === 5 || card === 6 || card === 7)) {
			cardsArr[1].push(cardArr.pop());
		}
		else if(zhuangSum === 6 && (card === 6 || card === 7)) {
			cardsArr[1].push(cardArr.pop());
		}
	}
	return cardsArr;
};

/*
 * 获取牌大小值
 */
gameLogic.getCardCount = function(card) {
	card = card%13+1;
	return (card >= 10)? 0:card;
};

/*
 * 获取数组牌和
 */
gameLogic.getCardArrCount = function(cardArr) {
	var i, count = 0;
	for(i = 0; i < cardArr.length; ++i) {
		count += this.getCardCount(cardArr[i]);
	}
	return count%10;
};

/* 
 * 获取结果
 */
gameLogic.getResout = function(cardsArr, pourGoldObj) {
	var resout = {};
	var type = this.getResoutType(cardsArr);
	var userWinObj = {};
	var key, direction, rate;
	for(direction in pourGoldObj) {
		if(pourGoldObj.hasOwnProperty(direction)) {
			rate = this.getRateByType(parseInt(direction, 10));
			if((type&gameLogic.WIN_HE) > 0 && (parseInt(direction, 10) === this.WIN_XIAN || parseInt(direction, 10) === this.WIN_ZHUANG)) {
				/*和牌时,闲和庄返回玩家的押注*/
			} else {
				if((parseInt(direction, 10)&type) > 0) {
					for(key in pourGoldObj[direction]) {
						if(pourGoldObj[direction].hasOwnProperty(key)) {
							if(! userWinObj[key]) {
								userWinObj[key] = pourGoldObj[direction][key]*rate;
							} else {
								userWinObj[key] += pourGoldObj[direction][key]*rate;
							}
						}
					}
				} else {
					for(key in pourGoldObj[direction]) {
						if(pourGoldObj[direction].hasOwnProperty(key)) {
							if(!userWinObj[key]) {
								userWinObj[key] = -pourGoldObj[direction][key];
							} else {
								userWinObj[key] -= pourGoldObj[direction][key];
							}
						}
					}
				}
			}
		}
	}
	resout.type = type;
	resout.userWinObj = userWinObj;
	resout.cardsArr = cardsArr;
	return resout;
};

/*
 * 获取玩家输赢金币总和
 */
gameLogic.getWinLoseGold = function(cardsArr, pourGoldObj) {
	var type = this.getResoutType(cardsArr);
	var winGold = 0, loseGold = 0;
	var key, direction, rate;
	for(direction in pourGoldObj) {
		if(pourGoldObj.hasOwnProperty(direction)) {
			rate = this.getRateByType(parseInt(direction, 10));
			if((type&gameLogic.WIN_HE) > 0 && (parseInt(direction, 10) === this.WIN_XIAN || parseInt(direction, 10) === this.WIN_ZHUANG)) {
				/*和牌时,闲和庄返回玩家的押注*/
			} else {
				if((parseInt(direction, 10)&type) > 0) {
					for(key in pourGoldObj[direction]) {
						if(pourGoldObj[direction].hasOwnProperty(key)) {
							winGold += pourGoldObj[direction][key]*rate;
						}
					}
				} else {
					for(key in pourGoldObj[direction]) {
						if(pourGoldObj[direction].hasOwnProperty(key)) {
							loseGold += pourGoldObj[direction][key];
						}
					}
				}
			}
		}
	}
	return {
		win: winGold,
		lose: loseGold
	};
};

/*
 * 获取最终获胜类型
 */
gameLogic.getResoutType = function(cardsArr) {
	var xianSum = this.getCardArrCount(cardsArr[0]); 
	var zhuangSum = this.getCardArrCount(cardsArr[1]);
	var type = 0;
	if(xianSum > zhuangSum) {
		type |= this.WIN_XIAN;
		if((cardsArr[0][0]%13) === (cardsArr[0][1]%13)) {
			type |= this.WIN_XIANDUI;
		}
	}
	else if(xianSum < zhuangSum) {
		type |= this.WIN_ZHUANG;
		if((cardsArr[1][0]%13) === (cardsArr[1][1]%13)) {
			type |= this.WIN_ZHUANGDUI;
		}
	} else {
		type |= this.WIN_HE;
	}
	return type;
};

/*
 * 获取倍率
 */
gameLogic.getRateByType = function(type) {
	if(type === gameLogic.WIN_HE) {
		return gameLogic.RATE_HE;
	}
	if(type === gameLogic.WIN_ZHUANG) {
		return gameLogic.RATE_ZHUANG;
	}
	if(type === gameLogic.WIN_XIAN) {
		return gameLogic.RATE_XIAN;
	}
	if(type === gameLogic.WIN_ZHUANGDUI) {
		return gameLogic.RATE_ZHUANGDUI;
	}
	if(type === gameLogic.WIN_XIANDUI) {
		return gameLogic.RATE_XIANDUI;
	} 
};

