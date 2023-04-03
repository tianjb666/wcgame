var logic = module.exports;
var gameProto = require('./gameProto');

logic.CARDS_COUNT				= 40;			// 所有牌张数
logic.CARDS_BUREAU_COUNT		= 8;			// 每局牌张数


/* 获取牌 */
logic.getCards= function() {
	var cards = [];
	var i, ran1, ran2, tmp;
	for(i = 0; i < this.CARDS_COUNT; ++i) { 
		cards[i] = i; 
	}
	for(i = 0; i < 100; ++i) {	/* 洗牌 */
		ran1 = Math.floor(Math.random()*this.CARDS_COUNT);
		ran2 = Math.floor(Math.random()*this.CARDS_COUNT);
		tmp = cards[ran1];
		cards[ran1] = cards[ran2];
		cards[ran2] = tmp;
	}
	return cards;
};

// 获取第n局的牌
logic.getCardsArrByBureau = function(cards, bureau) {
	var cardsArr = [[], [], [], []];
	var begPos = (bureau-1)*8;
	var i;
	for(i = 0; i < 8; ++i) {
		cardsArr[Math.floor(i/2)][i%2] = cards[begPos+i];
	}
	return cardsArr;
};

// 获取牌的点数
logic.getCardNumber = function(cardId) {
	if(cardId%10 === 0) {
		return 0.5;
	}
	return cardId%10;
};

// 判断是否是豹子
logic.verifyCardsIsBaozi = function(cardArr) {
	return (cardArr[0]%10 === cardArr[1]%10);
};

// 比较牌的大小	cardArr1>cardArr2-> 返回1
logic.compareCards = function(cardArr1, cardArr2) {
	var isBao1 = this.verifyCardsIsBaozi(cardArr1); 
	var isBao2 = this.verifyCardsIsBaozi(cardArr2);
	var count1_0 = this.getCardNumber(cardArr1[0]);
	var count1_1 = this.getCardNumber(cardArr1[1]);
	var count2_0 = this.getCardNumber(cardArr2[0]);
	var count2_1 = this.getCardNumber(cardArr2[1]);
	if(isBao1 && !isBao2) {
		return 1;
	}
	if(!isBao1 && isBao2) {
		return -1;
	}
	if(isBao1 && isBao2){
		if(count1_0 === count2_0) {
			return 0;
		} 
		if(count1_0 === 0.5) {
			return 1;
		}
		if(count2_0 === 0.5) {
			return -1;
		} 
		return (count1_0 > count2_0)? 1:-1;
	} 
	var num1 = (count1_0+count1_1)%10;
	var num2 = (count2_0+count2_1)%10;
	if(num1 === num2) {
		count1_0 = (count1_0 > count1_1)? count1_0:count1_1;
		count2_0 = (count2_0 > count2_1)? count2_0:count2_1;
		if(count1_0 === count2_0) {
			return 0;
		} 
		return (count1_0 > count2_0)? 1:-1;
	} 
	return (num1 > num2)? 1:-1;
};

// 计算结果
logic.getResout = function(cardsArr, pourPool) {
	var bankerWin = 0;
	var usersWin = {};
	var winArr = [];
	var sortArr = [gameProto.TIANMEN, gameProto.ZHONGMEN, gameProto.DIMEN];
	var i, j, dir, flag;
	for(i = 0; i < 3; ++i) {
		dir = sortArr[i];
		flag = this.compareCards(cardsArr[gameProto.ZHUANGJIA], cardsArr[dir]);
		if(flag === 0) { flag = 1; }
		winArr.push((flag === 1)? true : false);
		for(j = 0; j < pourPool[dir].length; ++j) {
			bankerWin += flag*pourPool[dir][j].pourGold;
			if(usersWin[pourPool[dir][j].uid]) {
				usersWin[pourPool[dir][j].uid] -= flag*pourPool[dir][j].pourGold;
			} else {
				usersWin[pourPool[dir][j].uid] = -flag*pourPool[dir][j].pourGold;
			}
		}
	}
	return {
		cardsArr: cardsArr,
		winArr: winArr,
		bankerWin: bankerWin,
		usersWin: usersWin
	};
};


