/**
 *  created by cly 17/4/10
 */

var gameLogic = module.exports;

gameLogic.COLOR_FANGKUAI	= 0;	// 方块
gameLogic.COLOR_CAOHUA		= 1;	// 草花
gameLogic.COLOR_HONGTAO		= 2;	// 红桃
gameLogic.COLOR_HEITAO		= 3;	// 黑桃

gameLogic.LOSE				= 0;	// 输
gameLogic.WIN				= 1;	// 赢

gameLogic.RATE_WUHUA		= 5;	// 无花牛
gameLogic.RATE_ZHADAN		= 4;	// 炸弹牛
gameLogic.RATE_NIUNIU		= 3;	// 牛牛
gameLogic.RATE_NIUDA		= 2;	// 大牛
gameLogic.RATE_NIUXIAO		= 1;	// 小牛

/*
 * 获取游戏结果
 */
gameLogic.getResout = function(cardsArr, scoreArr, bankIndex, robRate, baseRate, bankGold) {
	baseRate = baseRate || 1;	/*游戏场倍率*/
	var resout = [], i;
	for(i = 0; i < cardsArr.length; ++i) {
		resout[i] = {
			normal: this.getNormalCardType(cardsArr[i]),
			special: this.getSpecialCardTypeRate(cardsArr[i]),
			maxCard: this.getMaxCard(cardsArr[i]),
		};
	}
	var finalScoreArr = [];
	for(i = 0; i < scoreArr.length; ++i) { finalScoreArr[i] = 0; }
	var bankSpeRate = resout[bankIndex].special;
	var bankNorRate = this.getNormalCardTypeRate(resout[bankIndex].normal);
	var userSpeRate, userNorRate, rate;
	for(i = 0; i < cardsArr.length; ++i) {
		if(i !== bankIndex) {
			userSpeRate = resout[i].special;
			userNorRate = this.getNormalCardTypeRate(resout[i].normal);
			if(this.isCardArrBigger(cardsArr[bankIndex], cardsArr[i]) > 0) {
				rate = (bankSpeRate>0)? bankSpeRate:bankNorRate;
				finalScoreArr[bankIndex] += scoreArr[i]*rate*robRate*baseRate;
				finalScoreArr[i] -= scoreArr[i]*rate*robRate*baseRate;
			} else {
				rate = (userSpeRate>0)? userSpeRate:userNorRate;
				finalScoreArr[bankIndex] -= scoreArr[i]*rate*robRate*baseRate;
				finalScoreArr[i] += scoreArr[i]*rate*robRate*baseRate;
			}
		}
	}
	var bankOwnGold = bankGold;
	var indexArr = this.getPaySortIndexArr(bankIndex, cardsArr);
	var index;
	for(i = 0; i < indexArr.length; ++i) {
		index = indexArr[i];
		if(finalScoreArr[index] > 0) {
			if(finalScoreArr[index] <= bankGold) {
				bankGold -= finalScoreArr[index];
			} else {
				finalScoreArr[index] = (bankGold>0)? bankGold:0;
				bankGold = 0;
			}
		} else {
			bankGold -= finalScoreArr[index];
		}
	}
	if(bankGold === 0) {	/*庄家赔付完自己的金币*/
		finalScoreArr[bankIndex] = -bankOwnGold; 
	}
	return {
		cardsArr: cardsArr,
		finalScoreArr: finalScoreArr,
		bankIndex: bankIndex
	};
};

/*
 * 获取赔付顺序数组
 */
gameLogic.getPaySortIndexArr = function(bankIndex, cardsArr) {
	var payArr = [];
	var i, j;
	if(bankIndex === 0) {
		payArr.push(1);
	} else {
		payArr.push(0);
	}
	for(i = 0; i < cardsArr.length; ++i) {
		if(i !== bankIndex && payArr.indexOf(i) === -1) {
			if(!this.isCardArrBigger(cardsArr[i], cardsArr[bankIndex])) {	/*没有庄大,先赔给庄家*/
				payArr.unshift(i);
			} else {
				for(j = payArr.length-1; j >= 0; --j) {
					if(! this.isCardArrBigger(cardsArr[i], cardsArr[payArr[j]])) {
						break;
					}
				}
				if(j === -1) {
					payArr.unshift(i);
				} 
				else if(j === payArr.length-1) {
					payArr.push(i);
				}
				else {
					payArr.splice(j+1, 0, i);
				}
			}
		}
	}
	return payArr;
};

/*
 * 获取最大牌
 */
gameLogic.getMaxCard = function(cardArr) {
	var maxCard = cardArr[0], i;
	for(i = 1; i < cardArr.length; ++i) {
		if(!this.isCardBigger(maxCard, cardArr[i])) {
			maxCard = cardArr[i];
		}
	}
	return maxCard;
};

/*
 * 是否更大
 */
gameLogic.isCardBigger = function(card1, card2) {
	if(card1%13 === card2%13) {
		if(card1/13 < card2/13) {	/*比较花色*/
			return false;
		}
	} else {
		if(card2%13 === 0) {		/*A最大*/
			return false;
		} 
		if(card1%13 !== 0 && card2%13 > card1%13) {
			return false;
		}
	}
	return true;
};

/*
 * 比较两幅牌组
 */
gameLogic.isCardArrBigger = function(cardArr1, cardArr2) {
	var nor1 = this.getNormalCardType(cardArr1);
	var nor2 = this.getNormalCardType(cardArr2);
	var spe1 = this.getSpecialCardTypeRate(cardArr1);
	var spe2 = this.getSpecialCardTypeRate(cardArr2);
	if(spe1 !== spe2) {
		return (spe1 > spe2);
	} 
	if(spe1 === gameLogic.RATE_ZHADAN) {	/*四炸比较四炸单牌(特殊处理)*/ 
		var i, num1, num2;
		for(i = 1; i < cardArr1.length; ++i) {
			if(this.getCardCount(cardArr1[i]) === this.getCardCount(cardArr1[i-1])) {
				num1 = cardArr1[i];
			}
			if(this.getCardCount(cardArr2[i]) === this.getCardCount(cardArr2[i-1])) {
				num2 = cardArr2[i];
			}
		}
		return (num1 > num2);
	} 
	if(spe1 === gameLogic.RATE_WUHUA) {
		return this.compareCountThenColor(cardArr1, cardArr2);
	} 
	if(nor1 !== nor2) {
		return (nor1 > nor2);
	}
	return this.compareCountThenColor(cardArr1, cardArr2);
};

/*
 * 获取普通牛牛类型
 */
gameLogic.getNormalCardType = function(cards) {
	var i, j, k, sum = 0, rate = 0;
	var hasRate = false;
	var cardArr = [];
	for(i = 0; i < cards.length; ++i) {
		cardArr[i] = this.getCardCount(cards[i]);
		sum += cardArr[i];
	}

	for(i = 0; i < cardArr.length; ++i) {
		for(j = i+1; j < cardArr.length; ++j) {
			for(k = j+1; k < cardArr.length; ++k) {
				if((cardArr[i] + cardArr[j] + cardArr[k]) % 10 === 0) {
					hasRate = true;
					rate = (sum - cardArr[i] - cardArr[j] - cardArr[k]) % 10;
					break;
				}
			}
		}
	}
	if(rate === 0 && hasRate) {
		rate = 10;
	}

	return rate;
};

/*
 * 获取牛牛类型对应的倍率
 */
gameLogic.getNormalCardTypeRate = function(type) {
	if(type === 10) {
		return this.RATE_NIUNIU;
	} 
	if(type >= 7) {
		return this.RATE_NIUDA;
	} 
	return this.RATE_NIUXIAO;
};

/*
 * 获取牛牛类型对应的倍率
 */
gameLogic.getSpecialCardTypeRate = function(cards) {
	var rate = 0;
	if(this.isFiveColorNiu(cards)) {
		rate = gameLogic.RATE_WUHUA;
	}
	else if(this.isFourSameCard(cards)) {
		rate = gameLogic.RATE_ZHADAN;
	}
	return rate;
};

/*
 * 获取牌
 */
gameLogic.getCardsArr = function(count) {
	var cardArr = [];
	var i, j, k, m;
	for(i = 0; i < 52; ++i) {
		cardArr[i] = i;
	}
	var index1, index2, tmp;
	for(j = 0; j < cardArr.length; ++j) {
		index1 = Math.floor(Math.random()*cardArr.length);
		index2 = Math.floor(Math.random()*cardArr.length);
		tmp = cardArr[index1];
		cardArr[index1] = cardArr[index2];
		cardArr[index2] = tmp;
	}
	var cardsArr = [];
	for(k = 0; k < count; ++k) {
		tmp = [];
		for(m = 0; m < 5; ++m) {
			tmp.push(cardArr.pop());
		}
		cardsArr.push(tmp);
	}
	return cardsArr;
};

/*
 * 获取牌面值
 */
gameLogic.getCardNumber = function(cardId) {
	return cardId%13+1;
};

// convert JQK to 10 获取计算牛时牌值
gameLogic.getCardCount = function(cardId) {
	var count = this.getCardNumber(cardId);
	if(count > 10) {
		count = 10;
	}
	return count;
};

/*
 * 获取牌花色
 */
gameLogic.getCardColor = function(cardId) {
	return Math.floor(cardId%52/13);
};

/*
 * 5花牛
 */
gameLogic.isFiveColorNiu = function(cards) {
	var i;
	for(i = 0; i < cards.length; ++i) {
		if(this.getCardNumber(cards[i]) <= 10) {
			return false;
		}
	}
	return true;
};

/*
 * 炸弹牛
 */
gameLogic.isFourSameCard = function(cards) {
	var card1 = cards[0], card2 = cards[1];
	var count1 = 0, count2 = 0, i;
	for(i = 0; i < cards.length; ++i) {
		if(this.getCardNumber(cards[i]) === this.getCardNumber(card1)) {
			++ count1;
		}
		if(this.getCardNumber(cards[i]) === this.getCardNumber(card2)) {
			++ count2;
		}
	}

	return ((count1 >= 4) || (count2 >= 4));
};

/*
 * 先比大小后比花色
 */
gameLogic.compareCountThenColor = function(cardArr1, cardArr2) {
	var max1 = this.getMaxCard(cardArr1);
	var max2 = this.getMaxCard(cardArr2);
	return this.isCardBigger(max1, max2);
};

