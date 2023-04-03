var proto = module.exports;

proto.cardType = {
	danpai: { type: 0, name: 'danpai', rate: 0 },
	duizi: { type: 1, name: 'duizi', rate: 0 },
	liangdui: { type: 2, name: 'liangdui', rate: 0 },
	santiao: { type: 4, name: 'santiao', rate: 0 },
	shunzi: { type: 8, name: 'shunzi', rate: 0 },
	tonghua: { type: 16, name: 'tonghua', rate: 0 },
	hulu: { type: 32, name: 'hulu', rate: 0 },
	sitiao: { type: 64, name: 'sitiao', rate: 0 },
	tonghuashun: { type: 128, name: 'tonghuashun', rate: 0 },
	jingang: { type: 256, name: 'jingang', rate: 0 },
	guaipai: { type: 512, name: 'guaipai', rate: 0 }
};

/* 获取牌 */
proto.getCardsArr = function(chairCount) {
	if(chairCount > 4) {
		//console.log('error getCardsArr');
		return null;
	}
	var cardsArr = [[], [], [], []];
	var cards = [];
	var i, ran1, ran2, tmp;
	for(i = 0; i < 52; ++i) { cards[i] = i; }
	for(i = 0; i < 100; ++i) {	/* 洗牌 */
		ran1 = Math.floor(Math.random()*52);
		ran2 = Math.floor(Math.random()*52);
		tmp = cards[ran1];
		cards[ran1] = cards[ran2];
		cards[ran2] = tmp;
	}
	for(i = 0; i < 52; ++i) {
		cardsArr[Math.floor(i/13)].push(cards[i]);
	}
	for(i = chairCount; i < 4; ++i) {
		cardsArr.pop();
	}
	return cardsArr;
};

/* 根据牌的结果算分 */
proto.getResout = function(cardsArr, guaiArr, gameRule, baseScore) {
	var i, j;
	if(! guaiArr) {		// 默认无怪牌
		guaiArr = []; 
		for(i = 0; i < gameRule.memberCount; ++i) {
			guaiArr[i] = false;
		}
	}
	var scoresArr = [];
	for(i = 0; i < gameRule.memberCount; ++i) {
		scoresArr[i] = [];
		for(j = 0; j < gameRule.memberCount; ++j) {
			scoresArr[i][j] = [0, 0, 0];
		}
	}
	var daqiangArr = [];		// 打枪倍率
	var rateArr = [];			// 黑桃a翻倍倍率 
	var guaipaiScoreArr = [];	// 怪牌分数
	for(i = 0; i < gameRule.memberCount; ++i) {
		rateArr[i] = 1;
		guaipaiScoreArr[i] = 0;
		daqiangArr[i] = [];
		for(j = 0; j < gameRule.memberCount; ++j) {
			daqiangArr[i][j] = (i===j)?0:1;
		}
	}
	for(i = 0; i < guaiArr.length; ++i) {	// 怪牌分 
		if(guaiArr[i]) { 
			guaipaiScoreArr[i] = this.hasYitiaolong(cardsArr[i])? 26:3; 
		}
	}
	if(gameRule.otherRule.heiTaoA) {		// 黑桃A翻倍 
		for(i = 0; i < cardsArr.length; ++i) {	
			if(cardsArr[i].indexOf(39) !== -1) {
				rateArr[i] = 2;
			}
		}
	}
	for(i = 0; i < cardsArr.length; ++i) {	// 牌分
		if(!guaiArr[i]) {
			for(j = 0; j < cardsArr.length; ++j) {
				if(j !== i && !guaiArr[j]) {
					var score = 0;
					var touA = this.getTouArr(cardsArr[i]);
					var touB = this.getTouArr(cardsArr[j]);
					if(this.compareCards(touA, touB, this.getTouZhongWeiCardType(touA), this.getTouZhongWeiCardType(touB))) {
						score = 1;
						if(this.hasSantiao(touA)) { score = 3; }
					} else {
						score = -1;
						if(this.hasSantiao(touB)) { score = -3; }
					}
					scoresArr[i][j][0] = score;

					var zhongA = this.getZhongArr(cardsArr[i]);
					var zhongB = this.getZhongArr(cardsArr[j]);
					if(this.compareCards(zhongA, zhongB, this.getTouZhongWeiCardType(zhongA), this.getTouZhongWeiCardType(zhongB))) {
						score = 1;
						if(this.hasHulu(zhongA)) { score = 2; }
						else if(this.hasSitiao(zhongA)) { score = 8; }
						else if(this.hasTonghuashun(zhongA)) { score = 10; }
					} else {
						score = -1;
						if(this.hasHulu(zhongB)) { score = -2; }
						else if(this.hasSitiao(zhongB)) { score = -8; }
						else if(this.hasTonghuashun(zhongB)) { score = -10; }
					}
					scoresArr[i][j][1] = score;

					var weiA = this.getWeiArr(cardsArr[i]);
					var weiB = this.getWeiArr(cardsArr[j]);
					if(this.compareCards(weiA, weiB, this.getTouZhongWeiCardType(weiA), this.getTouZhongWeiCardType(weiB))) {
						score = 1;
						if(this.hasSitiao(weiA)) { score = 4; }
						else if(this.hasTonghuashun(weiA)) { score = 5; }
					} else {
						score = -1;
						if(this.hasSitiao(weiB)) { score = -4; }
						else if(this.hasTonghuashun(weiB)) { score = -5; }
					}
					scoresArr[i][j][2] = score;
				}
			}
		}
	}
	for(i = 0; i < scoresArr.length; ++i) { // 打枪倍率
		for(j = 0; j < scoresArr[i].length; ++j) {
			if(scoresArr[i][j][0] > 0 && scoresArr[i][j][1] > 0 && scoresArr[i][j][2] > 0) { daqiangArr[i][j] = 2; }
			if(scoresArr[i][j][0] < 0 && scoresArr[i][j][1] < 0 && scoresArr[i][j][2] < 0) { daqiangArr[i][j] = -2; }
		}
	}
	var hasSanchuan = function(i) {			//是否三穿
		if(!gameRule.otherRule.youSanChuan) {
			return false; 
		}
		var j, count = 0;
		for(j = 0; j < daqiangArr[i].length; ++j) {
			if(daqiangArr[i][j] > 1) { ++ count; }
		}
		return (count === 3);
	};
	for(i = 0; i < gameRule.memberCount; ++i) {	//三穿倍率
		for(j = 0; j < gameRule.memberCount; ++j) {
			if(i !== j) {
				if(hasSanchuan(i)) {
					daqiangArr[i][j] = 4;
				}
				else if(hasSanchuan(j)) {
					daqiangArr[i][j] = -4;
				}
			}
		}
	}
	for (let i = 0; i < scoresArr.length; ++i){
	    let score1 = scoresArr[i];
	    for (let j = 0; j < score1.length; ++j){
	        let score2 = score1[j];
	        for (let k = 0; k < score2.length; ++k){
                score2[k] *= baseScore;
            }
        }
    }
    for (let i = 0; i < guaipaiScoreArr.length; ++i){
        guaipaiScoreArr[i] *= baseScore;
    }
	return {
		cardsArr: cardsArr,
		scoresArr: scoresArr,
		guaipaiScoreArr: guaipaiScoreArr,
		daqiangArr: daqiangArr,
		rateArr: rateArr
	};
};

/* 获取玩家最后分 */
proto.getUserScore = function(chairId, resout) {
	var scoreArr = resout.scoresArr[chairId];
	var i, j, sum = 0;
	for(i = 0; i < scoreArr.length; ++i) {
		if(i !== chairId) {
			for(j = 0; j < scoreArr[i].length; ++j) {
				sum += scoreArr[i][j];
			}
		}
	}
	sum += resout.guaipaiScoreArr[chairId];
	return sum;
};

/* 获取牌的花色 */
proto.getCardColor = function(id) {
	var colorArr = ['fangkuai', 'meihua', 'hongtao', 'heitao'];
	return colorArr[Math.floor(id/13)];
};

/* 获取牌的类型,摆放错误时类型为null */
proto.getCardsType = function(arr) {
	if(arr.length !== 13) {
		//console.log('error: getCardsType');
		return null;
	}
	var touArr = this.getTouArr(arr);
	var zhongArr = this.getZhongArr(arr); 
	var weiArr = this.getWeiArr(arr);
	var type1 = 0, type2 = 0, type3 = 0;
	if(this.hasGuaipai(arr)) { /* 怪牌 */
		type1 = this.cardType.guaipai.type;
		type2 = this.cardType.guaipai.type;
		type3 = this.cardType.guaipai.type;
		return { type1: type1, type2: type2, type3: type3 };
	} else {
		type1 = this.getTouZhongWeiCardType(touArr);
		type2 = this.getTouZhongWeiCardType(zhongArr);
		type3 = this.getTouZhongWeiCardType(weiArr);
		if(this.compareCards(weiArr, zhongArr, type3, type2) && this.compareCards(zhongArr, touArr, type2, type1)) {
			return { type1: type1, type2: type2, type3: type3 };
		} else {
			return null;
		}
	}
};

/* 自动码牌 */
proto.autoSortCards = function(arr) {
	var touArr, zhongArr, weiArr;
	var curArr = [], i;
	for(i = 0; i < arr.length; ++i) {
		curArr[i] = arr[i];
	}
	weiArr = this.getMaxCardArr(curArr);
	for(i = 0; i < weiArr.length; ++i) {
		curArr.splice(curArr.indexOf(weiArr[i]), 1);
	}
	zhongArr = this.getMaxCardArr(curArr);
	for(i = 0; i < zhongArr.length; ++i) {
		curArr.splice(curArr.indexOf(zhongArr[i]), 1);
	}
	touArr = curArr;
	var array = [];
    touArr = this.sortCardByCountThenColor(touArr);
	for(i = 0; i < touArr.length; ++i) {
		array.push(touArr[i]);
	}
    zhongArr = this.sortCardByCountThenColor(zhongArr);
	for(i = 0; i < zhongArr.length; ++i) {
		array.push(zhongArr[i]);
	}
    weiArr = this.sortCardByCountThenColor(weiArr);
	for(i = 0; i < weiArr.length; ++i) {
		array.push(weiArr[i]);
	}
	return array;
};

/* 比较牌, arr1 > arr2 时为true */
proto.compareCards = function(arr1, arr2, type1, type2) {
	var i, j, num1, num2, count;
	var resout;
	for(i = 256; i > 0; i /= 2) {
		if((type1&i) > 0 && (type2&i) > 0) {
			break;
		}
		else if((type1&i) > 0 && (type2&i) === 0) {
			return true;
		}
		else if((type1&i) === 0 && (type2&i) > 0) {
			return false;
		}
	}
	if(i === this.cardType.tonghuashun.type || i === this.cardType.shunzi.type || i === this.cardType.tonghua.type || i === this.cardType.danpai.type) {
		resout = this.compareDanpai(arr1, arr2);
		if(resout !== 0) { return (resout < 0); }
		resout = this.compareHuase(arr1, arr2);
		return (resout < 0);
	}
	else if(i === this.cardType.sitiao.type || i === this.cardType.santiao.type || i === this.cardType.duizi.type || i === this.cardType.liangdui.type) {
		var duiArr1 = [], duiArr2 = [];
		var cardType = i;
		for(i = 0; i < arr1.length; ++i) {
			for(j = i+1; j < arr1.length; ++j) {
				if(arr1[i]%13 === arr1[j]%13) {
					if(duiArr1.indexOf(arr1[i]) === -1) {
						duiArr1.push(arr1[i]);
					}
					if(duiArr1.indexOf(arr1[j]) === -1) {
						duiArr1.push(arr1[j]);
					}
				}
			}
		}
		for(i = 0; i < arr2.length; ++i) {
			for(j = i+1; j < arr2.length; ++j) {
				if(arr2[i]%13 === arr2[j]%13) {
					if(duiArr2.indexOf(arr2[i]) === -1) {
						duiArr2.push(arr2[i]);
					}
					if(duiArr2.indexOf(arr2[j]) === -1) {
						duiArr2.push(arr2[j]);
					}
				}
			}
		}
		resout = this.compareDanpai(duiArr1, duiArr2);
		if(resout !== 0) { return (resout < 0); }

		// 头道对子特殊处理
		if(arr1.length === 3 && arr2.length === 3 && cardType === this.cardType.duizi.type) {
			var dan1, dan2;
			for(i = 0; i < 3; ++i) {
				if(arr1[i]%13 !== duiArr1[0]%13) {
					dan1 = arr1[i];
				}
				if(arr2[i]%13 !== duiArr2[0]%13) {
					dan2 = arr2[i];
				}
			}
			if(dan1%13 === dan2%13) {
				resout = dan2-dan1;
			} else {
				if(dan1%13 == 0) {
					resout = -1;
				} 
				else if(dan2%13 == 0) {
					resout = 1;
				} else {
					resout = dan2%13-dan1%13;
				}
					//resout = dan2%13-dan1%13;
			}
		} else {
			resout = this.compareDanpai(arr1, arr2);
		}
		if(resout !== 0) { return (resout < 0); }
		resout = this.compareHuase(arr1, arr2);
		return (resout < 0);
	}
	else if(i === this.cardType.hulu.type) {
		for(i = 0; i < arr1.length; ++i) {
			count = 0;
			for(j = i+1; j < arr1.length; ++j) {
				if(arr1[j]%13 === arr1[i]%13) { ++ count; }
			}
			if(count === 2) { 
				num1 = arr1[i]; 
				break;
			}
		}
		for(i = 0; i < arr2.length; ++i) {
			count = 0;
			for(j = i+1; j < arr2.length; ++j) {
				if(arr2[j]%13 === arr2[i]%13) { ++ count; }
			}
			if(count === 2) { 
				num2 = arr2[i]; 
				break;
			}
		}
		resout = this.cardSortFunc(num1, num2);
		return (resout < 0);
	}
};

/* arr1>arr2: <0	arr1<arr2: >0	arr1=arr2: =0*/
proto.compareDanpai = function(arr1, arr2) {
	arr1 = this.sortCardByCountThenColor(arr1);
	arr2 = this.sortCardByCountThenColor(arr2);
	var i, j;
	for(i = 0; i < arr1.length && i < arr2.length; ++i) {
		j = this.cardSortFunc(arr1[i], arr2[i]);
		if(j !== 0) { return j; }
	}
	return 0;
};

proto.compareHuase = function(arr1, arr2) {
	arr1 = this.sortCardByCountThenColor(arr1);
	arr2 = this.sortCardByCountThenColor(arr2);
	return arr2[0]-arr1[0];
};


/* 有对子 */
proto.hasDuizi = function(arr) {
	var i, j;
	var cards = this.removeCardColor(arr);
	for(i = 0; i < cards.length; ++i) {
		var count = 0;
		for(j = 0; j < cards.length; ++j) {
			if(cards[i] === cards[j]) {
				++ count;
			}
		}
		if(count >= 2) {
			return true;
		}
	}
	return false;
};

/* 有两对 */
proto.hasLiangdui = function(arr) {
	if(arr.length < 4) {
		return false;
	}
	var i, j;
	var cards = this.removeCardColor(arr);
	var duiArr = [];
	for(i = 0; i < cards.length; ++i) {
		if(duiArr.indexOf(cards[i]) === -1) {
			var count = 0;
			for(j = 0; j < cards.length; ++j) {
				if(cards[i] === cards[j]) {
					++ count;
				}
			}
			if(count >= 2) {
				duiArr.push(cards[i]);
				if(duiArr.length > 1) { 
					return true; 
				}
			}
		}
	}
	return false;
};

/* 有三条 */
proto.hasSantiao = function(arr) {
	var cards = this.removeCardColor(arr);
	for(var i = 0; i < cards.length; ++i) {
		var k = 0;
		for(var j = 0; j < cards.length; ++j) {
			if(cards[i] === cards[j]) { 
				++ k; 
			}
		}
		if(k >= 3) { 
			return true; 
		}
	}
	return false;
};

/* 有顺子 */
proto.hasShunzi = function(arr) {
	if(arr.length < 5) { 
		return false; 
	}
	arr = arr.sort(this.cardSortFunc); /* 大到小 */
	var cards = []; 
	for(var i = 0; i < arr.length; ++i) {	//复制arr,以免操作影响arr
		cards[i] = arr[i];
	}
	if(cards[0]%13 === 0) {	// A的特殊处理
		cards.push(cards[0]);
	}
	var count = 0;
	for(i = 1; i < cards.length; ++i) {
		if((cards[i-1]+13-1)%13 === cards[i]%13 || (cards[i-1]-1)%13 === cards[i]%13) {
			++ count;
		}
		else if(cards[i]%13 !== cards[i-1]%13) {
			count = 0;
		}
		if(count === 4) {
			return true;
		}
	}
	return false;
};

/* 有同花 */
proto.hasTonghua = function(arr) {
	if(arr.length < 5) { return false; }
	for(var i = 0; i < 4; ++i) {
		var count = 0;
		for(var j = 0; j < arr.length; ++j) {
			if(Math.floor(arr[j]/13) === i) { 
				++ count; 
			}
		}
		if(count >= 5) { 
			return true; 
		}
	}
	return false;
};

/* 有葫芦 */
proto.hasHulu = function(arr) {
	if(arr.length < 5) { 
		return false; 
	}
	var cards = this.removeCardColor(arr);
	var santiaoArr = [], duiArr = [];
	for(var i = 0; i < cards.length; ++i) {
		if(duiArr.indexOf(cards[i]) === -1 && santiaoArr.indexOf(cards[i]) === -1) {
			var	k = 0;
			for(var j = 0; j < cards.length; ++j) {
				if(cards[j] === cards[i]) { ++ k; }
			}
			if(k === 2 && duiArr.indexOf(cards[i]) === -1) { 
				duiArr.push(cards[i]);
			}
			if(k >= 3 && santiaoArr.indexOf(cards[i]) === -1) { 
				santiaoArr.push(cards[i]);
			}
		}
	}
	if(santiaoArr.length >= 2) {
		return true;
	}
	else if(santiaoArr.length >= 1 && duiArr.length >= 1) {
		return true;
	} else {
		return false;
	}
	//return (santiaoArr.length >=1 && duiArr.length >= 1);
};

/* 有四条 */
proto.hasSitiao = function(arr) {
	if(arr.length < 5) { return false; }
	var cards = this.removeCardColor(arr);
	for(var i = 0; i < cards.length; ++i) {
		var count = 0;
		for(var j = 0; j < cards.length; ++j) {
			if(cards[j] === cards[i]) { 
				++ count; 
			}
		}
		if(count === 4) { 
			return true; 
		}
	}
	return false;
};

/* 有同花顺 */
proto.hasTonghuashun = function(arr) {
	if(arr.length < 5) { return false; }
	for(var i = 0; i < 4; ++i) {
		var cards = [];
		for(var j = 0; j < arr.length; ++j) {
			if(Math.floor(arr[j]/13) === i) {
				cards.push(arr[j]);
			}
		}
		if(this.hasShunzi(cards)) { 
			return true; 
		}
	}
	return false;
};

/* 有三花 */
proto.hasSanhua = function(arr) {
	if(arr.length !== 13) { return false; }
	var i, j, count, sum = 0;
	for(i = 0; i < 4; ++i) {
		count = 0;
		for(j = 0; j < arr.length; ++j) {
			if(Math.floor(arr[j]/13) === i) { ++ count; }
		}
		if(count === 0 || count === 3 || count === 5 || count === 8 || count === 10 || count === 13) {
			sum += count;
		} else {
			return false;
		}
	}
	return (sum === 13);
};

/* 有一条龙 */
proto.hasYitiaolong = function(arr) {
	if(arr.length !== 13) { return false; }
	var cards = this.removeCardColor(arr);
	cards.sort(function(a, b) { return a - b; }); /* 小到大 */
	var i;
	for(i = 1; i < cards.length; ++i) {
		if(cards[i] === cards[i-1]) {
			return false;
		}
	}
	return true;
};

/* 有六对半 */
proto.hasLiuduiban = function(arr) {
	if(arr.length !== 13) { return false; }
	var cards = this.removeCardColor(arr);
	var i = 0, j;
	while(i < cards.length) {
		j = cards.indexOf(cards[i], i+1);
		if(j !== -1) {
			cards.splice(j, 1);
			cards.splice(i, 1);
		} else {
			++i;
		}
	}
	return (cards.length === 1);
};

proto.hasGuaipai = function(arr) {
	return this.hasLiuduiban(arr) || this.hasYitiaolong(arr) || this.hasSanhua(arr) || this.hasSanshun(arr);
};

/* 获取对子 */
proto.getDuizi = function(arr) {
	//console.log('getDuizi start');
	arr = this.sortCardByCountThenColor(arr);
	if(arr.length === 3) { return [[arr[0], arr[1], arr[2]]]; }
	if(arr.length === 5) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; } 
	var cards = this.removeCardColor(arr);
	var i, j, k, m, n;
	var resout = [], duiArr = [], danArr = [];
	for(i = 0; i < cards.length; ++i) {
		var count = 0;
		for(j = 0; j < cards.length; ++j) {
			if(cards[i] === cards[j]) { ++count; }
		}
		if(count >= 2 && duiArr.indexOf(cards[i]) === -1) {
				duiArr.push(cards[i]);
		}
		if(count === 1) {
			danArr.unshift(arr[i]);
		}
	}
	if(danArr.length < 3) {
		for(i = duiArr.length-1; i >= 0; --i) {
			danArr.push(arr[cards.indexOf(duiArr[i])]);
		}
	}

	var fillArr, pos, duiPosArr, c1, c2;
	for(j = 0; j < danArr.length; ++j) {
		for(k = j+1; k < danArr.length; ++k) {
			for(m = k+1; m < danArr.length; ++m) {
				for(i = 0; i < duiArr.length; ++i) {
					if(danArr[j]%13 !== duiArr[i] && danArr[k]%13 !== duiArr[i] && danArr[m]%13 !== duiArr[i]) {
						pos = cards.indexOf(duiArr[i]);
						c1 = arr[pos];
						pos = cards.indexOf(duiArr[i], pos+1);
						c2 = arr[pos];
						fillArr = [];
						fillArr.push(c1);
						fillArr.push(c2);
						fillArr.push(danArr[j]);
						fillArr.push(danArr[k]);
						fillArr.push(danArr[m]);
						resout.push(fillArr);
					}
				}
			}
		}
	}
	//console.log('getDuizi end');
	return resout;
};

/* 获取两对 */
proto.getLiangdui = function(arr) {
	//console.log('getLiangdui start');
	var resout = [];
	if(arr.length < 5) { return resout; }
	if(arr.length === 5) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; }
	arr = this.sortCardByCountThenColor(arr);
	var cards = this.removeCardColor(arr);
	var duiArr = [], danArr = [], sanArr = [];
	var i, j, k;
	for(i = 0; i < cards.length; ++i) {
		if(duiArr.indexOf(cards[i]) === -1) {
			var count = 0;
			for(j = 0; j < cards.length; ++j) {
				if(cards[i] === cards[j]) {
					++ count;
				}
			}
			if(count === 2 && duiArr.indexOf(cards[i]) === -1) {
				duiArr.push(cards[i]);
			} 
			else if(count > 2 && sanArr.indexOf(cards[i]) === -1) {
				sanArr.push(cards[i]);
			}
			else if(count === 1) {
				danArr.unshift(arr[i]);
			}
		}
	}
	if(danArr.length === 0) { 
		if(duiArr.length > 2) {
			for(i = duiArr.length-1; i >= 0; --i) {
				danArr.push(arr[cards.indexOf(duiArr[i])]);
			}
		} else {
			for(i = sanArr.length-1; i >= 0; --i) {
				danArr.push(arr[cards.indexOf(sanArr[i])]);
			}
		}
	}
	if(duiArr.length < 2) {
			for(i = sanArr.length-1; i >= 0; --i) {
				duiArr.push(sanArr[i]);
			}
	}
	var tmpArr, pos;
	for(k = 0; k < danArr.length; ++k) {
		for(i = 0; i < duiArr.length; ++i) {
			for(j = i+1; j < duiArr.length; ++j) {
				if(danArr[k]%13 !== duiArr[i] && danArr[k]%13 !== duiArr[j]) {
					tmpArr = [];
					pos = cards.indexOf(duiArr[i]);
					tmpArr.push(arr[pos]);
					pos = cards.indexOf(duiArr[i], pos+1);
					tmpArr.push(arr[pos]);
					pos = cards.indexOf(duiArr[j]);
					tmpArr.push(arr[pos]);
					pos = cards.indexOf(duiArr[j], pos+1);
					tmpArr.push(arr[pos]);
					tmpArr.push(danArr[k]);
					resout.push(tmpArr);
				}
			}
		}
	}
	//console.log('getLiangdui end');
	return resout;
};

/* 获取三条 */
proto.getSantiao = function(arr) {
	//console.log('getSantiao start');
	var resout = [];
	if(arr.length === 3) { return [[arr[0], arr[1], arr[2]]]; }
	if(arr.length === 5) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; }
	if(arr.length < 5) { return resout; }
	arr = this.sortCardByCountThenColor(arr);
	var cards = this.removeCardColor(arr);
	var i, j, k, count, pos;
	var santiaoArr = [];
	var danArr = [];
	var tmpArr;
	for(i = 0; i < cards.length; ++i) {
		if(santiaoArr.indexOf(cards[i]) === -1) {
			count = 0;
			for(j = 0; j < cards.length; ++j) {
				if(cards[i] === cards[j]) { ++ count; }
			}
			if(count >= 3) { 
				santiaoArr.push(cards[i]); 
			}
			if(count === 1) { 
				danArr.push(arr[i]); 
			}
		}
	}
	if(danArr.length < 2) { 
		danArr = arr; 
	}
	for(i = 0; i < santiaoArr.length; ++i) {
		for(j = danArr.length-1; j >= 0; --j) {
			if(danArr[j]%13 !== santiaoArr[i]) {
				for(k = j-1; k >= 0; --k) {
					if(danArr[k]%13 !== santiaoArr[i]) {
						tmpArr = [];
						pos = cards.indexOf(santiaoArr[i]);
						tmpArr.push(arr[pos]);
						pos = cards.indexOf(santiaoArr[i], pos+1);
						tmpArr.push(arr[pos]);
						pos = cards.indexOf(santiaoArr[i], pos+1);
						tmpArr.push(arr[pos]);
						tmpArr.push(danArr[j]);
						tmpArr.push(danArr[k]);
						resout.push(tmpArr);
					}
				}
			}
		}
	}
	//console.log('getSantiao end');
	return resout;
};

/* 获取顺子 */
proto.getShunzi = function(arr) {
	var resout = [];
	if(arr.length < 5) { return resout; }
	if(arr.length === 5) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; }
	var cards = this.sortCardByCountThenColor(arr); /* 大到小 */
	var i; 
	var length = cards.length;
	for(i = 0; i < length && cards[i]%13 === 0; ++i) {
		cards.push(cards[i]);
	}
	var j, count;
	var shunziArr = [], tmpArr;
	for(i = 1; i < cards.length; ++i) {
		count = 1;
		for(j = i; j < cards.length; ++j) {
			if((13+cards[j-1]-1)%13 === cards[j]%13 || cards[j-1]%13-1 === cards[j]%13) {
				++ count;
				if(count === 5) {
					if(shunziArr.indexOf(i-1) === -1) {
						shunziArr.push(i-1);
					}
					break;
				}
			} 
			else if(cards[j]%13 !== cards[j-1]%13) {
				break;
			}
		}
	}
	for(i = 0; i < shunziArr.length; ++i) {
		tmpArr = [];
		j = shunziArr[i];
		while(tmpArr.length < 5) {
			if(tmpArr.length === 0) {
				tmpArr.push(cards[j]);
			}
			else if(tmpArr.length > 0 && cards[j]%13 !== cards[j-1]%13) {
				tmpArr.push(cards[j]);
			}
			++j;
		}
		resout.push(tmpArr);
	}
	return this.sortResoutArr(resout);
};

/* 获取同花 */
proto.getTonghua = function(arr) {
	var resout = [];
	if(arr.length < 5) { return resout; }
	if(arr.length === 5) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; }
	for(var i = 0; i < 4; ++i) {
		var tonghuaArr = [];
		for(var j = 0; j < arr.length; ++j) {
			if(Math.floor(arr[j]/13) === i) {
				tonghuaArr.push(j);
			}
		}
		if(tonghuaArr.length >= 5) {
			for(var k = 0; k < tonghuaArr.length; ++k) {
				for(var l = k+1; l < tonghuaArr.length; ++l) {
					for(var m = l+1; m < tonghuaArr.length; ++m) {
						for(var n = m+1; n < tonghuaArr.length; ++n) {
							for(var o = n+1; o < tonghuaArr.length; ++o) {
								resout.push([
									arr[tonghuaArr[k]],
									arr[tonghuaArr[l]],
									arr[tonghuaArr[m]],
									arr[tonghuaArr[n]],
									arr[tonghuaArr[o]]
								]);
							}
						}
					}
				}
			}
		}
	}
	return resout;
};

/* 获取葫芦 */
proto.getHulu = function(arr) {
	//console.log('getHulu start');
	var resout = [];
	if(arr.length === 5) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; }
	if(arr.length < 5) { return resout; }
	arr = this.sortCardByCountThenColor(arr);
	var cards = this.removeCardColor(arr);
	var i, j, k, count, duiArr = [], santiaoArr = [];
	var tmpArr, pos;
	for(i = 0; i < cards.length; ++i) {
		count = 0;
		for(j = 0; j < cards.length; ++j) {
			if(cards[j] === cards[i]) { ++ count; }
		}
		if(count >= 3 && santiaoArr.indexOf(cards[i]) === -1) {
			santiaoArr.push(cards[i]);
		}
		if(count === 2 && duiArr.indexOf(cards[i]) === -1) {
			duiArr.push(cards[i]);
		}
	}
	if(duiArr.length === 0) {
		for(i = santiaoArr.length-1; i >= 0; --i) {
			duiArr.push(santiaoArr[i]);
		}
	}
	for(i = 0; i < santiaoArr.length; ++i) {
		for(j = duiArr.length-1; j >= 0; --j) {
			if(santiaoArr[i] !== duiArr[j]) {
				tmpArr = [];
				pos = -1;
				for(k = 0; k < 3; ++k) {
					pos = cards.indexOf(santiaoArr[i], pos+1);
					tmpArr.push(arr[pos]);
				}
				pos = cards.indexOf(duiArr[j]);
				tmpArr.push(arr[pos]);
				pos = cards.indexOf(duiArr[j], pos+1);
				tmpArr.push(arr[pos]);
				resout.push(tmpArr);
			}
		}
	}
	//console.log('getHulu end');
	return resout;
};

/* 获取四条 */
proto.getSitiao = function(arr) {
	//console.log('getSitiao start');
	var resout = [];
	if(arr.length < 5) { 
		return resout; 
	}
	else if(arr.length === 5) { 
		return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; 
	}
	var cards = this.removeCardColor(arr);
	var i, j, k, count;
	var sitiaoArr = [];
	var danpaiArr = [];
	var pos, tmpArr;
	for(i = 0; i < cards.length; ++i) {
		count = 0;
		if(sitiaoArr.indexOf(cards[i]) === -1) {
			for(j = 0; j < cards.length; ++j) {
				if(cards[j] === cards[i]) { ++ count; }
			}
			if(count === 4) { sitiaoArr.push(cards[i]); }
			if(count === 1) { danpaiArr.push(arr[i]); }
		}
	}
	if(danpaiArr.length === 0) {	//无单牌 随意组
		danpaiArr = arr;
	}
	for(i = 0; i < sitiaoArr.length; ++i) {
		for(j = danpaiArr.length-1; j >= 0; --j) {
			if(danpaiArr[j]%13 !== sitiaoArr[i]) {
				tmpArr = [];
				pos = -1;
				for(k = 0; k < 4; ++k) {
					pos = cards.indexOf(sitiaoArr[i], pos+1);
					tmpArr.push(arr[pos]);
				}
				tmpArr.push(danpaiArr[j]);
				resout.push(tmpArr);
			}
		}
	}
	//console.log('getSitiao start');
	return resout;
};

/* 获取同花顺 */
proto.getTonghuashun = function(arr) {
	var tonghuaArr = this.getTonghua(arr);
	var resout = [];
	for(var i = 0; i < tonghuaArr.length; ++i) {
		if(this.hasShunzi(tonghuaArr[i])) {
			resout.push(tonghuaArr[i]);
		}
	}
	if(resout.length === 0) {
		//console.log(tonghuaArr, 'tonghuaArr');
	}
	return resout;

};

/* 补全对子 */
proto.fillDuizi = function(arr, num, count) {
	var i, j, k;
	var resout = [];
	var cards = [];
	for(i = 0; i < arr.length; ++i) {
		if(arr[i]%13 !== num) {
			cards.push(arr[i]);
		}
	}
	cards.sort(function(a, b) { return a%13 - b%13; }); /* 小到大 */
	if(count === 3) {
		for(i = 0; i < cards.length; ++i) {
			resout.push([arr[i]]);
		}
	} 
	else if(count === 5) {
		for(i = 0; i < cards.length; ++i) {
			for(j = i+1; j < cards.length; ++j) {
				for(k = j+1; k < cards.length; ++k) {
					resout.push([arr[i], arr[j], arr[k]]);
				}
			}
		}
	}
	return resout;
};

proto.removeCardColor = function(arr) {
	var i, cards = [];
	for(i = 0; i < arr.length; ++i) {
		cards.push(arr[i]%13);
	}
	return cards;
};

/* 获取牌在数组中的位置 */
proto.getCardInArr = function(arr, num, pos) {
	var i;
	for(i = pos || 0; i < arr.length; ++i) {
		if(arr[i]%13 === num) {
			return i;
		}
	}
	if(i === arr.length) {
		return -1;
	}
};

/* 选取最大的牌型 */
proto.getMaxCardArr = function(arr) {
	if(arr.length === 5 || arr.length === 3) { return arr; }
	var resout, i, j, type, cards;
	if(this.hasTonghuashun(arr)) {
		resout = this.getTonghuashun(arr);
		type = this.cardType.tonghuashun.type;
	}
	else if(this.hasSitiao(arr)) {
		resout = this.getSitiao(arr);
		type = this.cardType.sitiao.type;
	}
	else if(this.hasHulu(arr)) {
		resout = this.getHulu(arr);
		type = this.cardType.hulu.type;
	}
	else if(this.hasTonghua(arr)) {
		resout = this.getTonghua(arr);
		type = this.cardType.tonghua.type;
	}
	else if(this.hasShunzi(arr)) {
		resout = this.getShunzi(arr);
		type = this.cardType.shunzi.type;
	}
	else if(this.hasSantiao(arr)) {
		resout = this.getSantiao(arr);
		type = this.cardType.santiao.type;
	}
	else if(this.hasLiangdui(arr)) {
		resout = this.getLiangdui(arr);
		type = this.cardType.liangdui.type;
	}
	else if(this.hasDuizi(arr)) {
		resout = this.getDuizi(arr);
		type = this.cardType.duizi.type;
	}
	if(resout && resout.length > 0) {
		for(i = 0, j = 0; i < resout.length-1; ++i) {
			if(!this.compareCards(resout[j], resout[i+1], type, type)) {
				j = i+1;
			}
		}
		return resout[j];
	} else {
		cards = this.sortCardByCountThenColor(arr);
		var array = [];
		for(i = 0; i < 5; ++i) {
			array.push(cards[i]);
		}
		return array;
	}
};

proto.getTouArr = function(arr) {
	return [arr[0], arr[1], arr[2]];
};

proto.getZhongArr = function(arr) {
	return [arr[3], arr[4], arr[5], arr[6], arr[7]];
};

proto.getWeiArr = function(arr) {
	return [arr[8], arr[9], arr[10], arr[11], arr[12]];
};

/* type1 > type2 时为true*/
proto.compareCardType = function(type1, type2) {
	if(type1 === this.cardType.guaipai.type && type2 === this.cardType.guaipai.type) {
		return -1;
	}
	else if(type1 === this.cardType.guaipai.type) {
		return 1;
	}
	else if(type2 === this.cardType.guaipai.type) {
		return -1;
	}
	var i;
	for(i = 512; i > 0; i /= 2) {
		if((type1&i) > 0 && (type2&i) === 0) {
			return 1;
		}
		else if((type1&i) === 0 && (type2&i) > 0) {
			return -1;
		}
	}
	return 0;
};

proto.getTouZhongWeiCardType = function(arr) {
	var type = 0;
	if(this.hasDuizi(arr)) { type |= this.cardType.duizi.type; }
	if(this.hasLiangdui(arr)) { type |= this.cardType.liangdui.type; }
	if(this.hasSantiao(arr)) { type |= this.cardType.santiao.type; }
	if(this.hasShunzi(arr)) { type |= this.cardType.shunzi.type; }
	if(this.hasTonghua(arr)) { type |= this.cardType.tonghua.type; }
	if(this.hasHulu(arr)) { type |= this.cardType.hulu.type; }
	if(this.hasSitiao(arr)) { type |= this.cardType.sitiao.type; }
	if(this.hasTonghuashun(arr)) { type |= this.cardType.tonghuashun.type; }
	return type;
};

proto.sortCardByCountThenColor = function(arr) {
	var cards = [], tmpArr;
	var i, j;
	for(i = 0; i < arr.length; ++i) {
		tmpArr = [];
		if(arr[i]%13 === 0) {
			tmpArr.push(arr[i]);
		}
		tmpArr.sort(function(a, b) { return b - a; }); /* 大到小 */
		for(j = 0; j < tmpArr.length; ++j) {
			cards.push(tmpArr[j]);
		}
	}
	for(i = 12; i > 0; --i) {
		tmpArr = [];
		for(j = 0; j < arr.length; ++j) {
			if(arr[j]%13 === i) {
				tmpArr.push(arr[j]);
			}
		}
		tmpArr.sort(function(a, b) { return b - a; }); /* 大到小 */
		for(j = 0; j < tmpArr.length; ++j) {
			cards.push(tmpArr[j]);
		}
	}
	return cards;
};

// 排序获取牌型结果
proto.sortResoutArr = function(resout) {
	if(resout.length <= 1) {
		return resout;
	}
	var type = this.getTouZhongWeiCardType(resout[0]);
	for(var i = 0; i < resout.length; ++i) {
		var max = i;
		for(var j = i+1; j < resout.length; ++j) {
			if(!this.compareCards(resout[max], resout[j], type, type)) {
				max = j;
			}
		}
		var tmp = resout[i];
		resout[i] = resout[max];
		resout[max] = tmp;
	}
	return resout;
};

proto.kickArrFromArr = function(arr, toKickArr) {
	var i;
	var array = [], index;
	for(i = 0; i < arr.length; ++i) { array[i] = arr[i]; }
	for(i = 0; i < toKickArr.length; ++i) {
		index = array.indexOf(toKickArr[i]);
		while(index !== -1) {
			array.splice(index, 1);
			index = array.indexOf(toKickArr[i], index+1);
		}
	}
	return array;
};

/* 获取最后分数数组 */
proto.getScoreArrByResout = function(resout) {
	var i, j, k; 
	var memberCount = resout.cardsArr.length;
	var scoreArr = [];
	for(i = 0; i < memberCount; ++i) {
		scoreArr[i] = 0;
	}
	var daqiang, guaiScore, rate;
	for(i = 0; i < memberCount; ++i) {
		guaiScore = 0;
		for(j = 0; j < memberCount; ++j) {
			rate = resout.rateArr[i]*resout.rateArr[j];
			daqiang = Math.abs(resout.daqiangArr[i][j]);
			for(k = 0; k < 3; ++k) {
				scoreArr[i] += resout.scoresArr[i][j][k]*daqiang*rate;
			}
			if(resout.guaipaiScoreArr[i] !== 0 && resout.guaipaiScoreArr[j] === 0) {
				guaiScore += resout.guaipaiScoreArr[i]*rate;
			}
			else if(resout.guaipaiScoreArr[i] === 0 && resout.guaipaiScoreArr[j] !== 0) {
				guaiScore -= resout.guaipaiScoreArr[j]*rate;
			}
		}
		scoreArr[i] += guaiScore;
	}
	return scoreArr;
};

/* 获取所有玩家的头道分*/
proto.getTouScoreArrByResout = function(resout) {
	var i, j, daqiang, rate;
	var memberCount = resout.cardsArr.length;
	var scoreArr = [];
	for(i = 0; i < memberCount; ++i) {
		scoreArr[i] = 0;
	}
	for(i = 0; i < memberCount; ++i) {
		for(j = 0; j < memberCount; ++j) {
			daqiang = Math.abs(resout.daqiangArr[i][j]);
			rate = resout.rateArr[i]*resout.rateArr[j];
			scoreArr[i] += resout.scoresArr[i][j][0]*daqiang*rate;
		}
	}
	return scoreArr;
};

/* 获取所有玩家的中道分*/
proto.getZhongScoreArrByResout = function(resout) {
	var i, j, daqiang, rate;
	var memberCount = resout.cardsArr.length;
	var scoreArr = [];
	for(i = 0; i < memberCount; ++i) {
		scoreArr[i] = 0;
	}
	for(i = 0; i < memberCount; ++i) {
		for(j = 0; j < memberCount; ++j) {
			daqiang = Math.abs(resout.daqiangArr[i][j]);
			rate = resout.rateArr[i]*resout.rateArr[j];
			scoreArr[i] += resout.scoresArr[i][j][1]*daqiang*rate;
		}
	}
	return scoreArr;
};

/* 获取所有玩家的尾道分*/
proto.getWeiScoreArrByResout = function(resout) {
	var i, j, daqiang, rate;
	var memberCount = resout.cardsArr.length;
	var scoreArr = [];
	for(i = 0; i < memberCount; ++i) {
		scoreArr[i] = 0;
	}
	for(i = 0; i < memberCount; ++i) {
		for(j = 0; j < memberCount; ++j) {
			daqiang = Math.abs(resout.daqiangArr[i][j]);
			rate = resout.rateArr[i]*resout.rateArr[j];
			scoreArr[i] += resout.scoresArr[i][j][2]*daqiang*rate;
		}
	}
	return scoreArr;
};

/* 转化为存储数据 */
proto.changeToMongoData = function(record) {
	var i, j, k;
	var cardsArr = [];
	for(i = 0; i < record.cardsArr.length; ++i) {
		for(j = 0; j < record.cardsArr[i].length; ++j) {
			for(k = 0; k < record.cardsArr[i][j].length; ++k) {
				cardsArr.push(record.cardsArr[i][j][k]);
			}
		}
	}
	record.cardsArr = cardsArr;

	var guaiArr = [];
	for(i = 0; i < record.guaiArr.length; ++i) {
		for(j = 0; j < record.guaiArr[i].length; ++j) {
			guaiArr.push(record.guaiArr[i][j]);
		}
	}
	record.guaiArr = guaiArr;

	var scoresArr = [];
	for(i = 0; i < record.scoresArr.length; ++i) {
		for(j = 0; j < record.scoresArr[i].length; ++j) {
			scoresArr.push(record.scoresArr[i][j]);
		}
	}
	record.scoresArr = scoresArr;
	record.gameRule = JSON.stringify(record.gameRule); 
	return record;
};

/* 转化为服务器数据 */
proto.changeToServerData = function(mongoData) {
	mongoData.gameRule = JSON.parse(mongoData.gameRule); 
	var memberCount = mongoData.gameRule.memberCount; 
	var i, j, k;

	var tmp;
	var cardsArr = [];
	for(i = 0; i < mongoData.cardsArr.length; i+=memberCount*13) {
		tmp = [];
		for(j = 0; j < memberCount; ++j) {
			tmp[j] = [];
			for(k = 0; k < 13; ++k) {
				tmp[j][k] = mongoData.cardsArr[i+j*13+k];
			}
		}
		cardsArr.push(tmp);
	}
	mongoData.cardsArr = cardsArr;

	var guaiArr = [];
	for(i = 0; i < mongoData.guaiArr.length; i+=memberCount) {
		tmp = [];
		for(j = 0; j < memberCount; ++j) {
			tmp[j] = mongoData.guaiArr[i+j];
		}
		guaiArr.push(tmp);
	}
	mongoData.guaiArr = guaiArr;

	var scoresArr = [];
	for(i = 0; i < mongoData.scoresArr.length; i+=memberCount) {
		tmp = [];
		for(j = 0; j < memberCount; ++j) {
			tmp[j] = mongoData.scoresArr[i+j];
		}
		scoresArr.push(tmp);
	}
	mongoData.scoresArr = scoresArr;
	return mongoData;
};


/* 牌从大到小排序 */
proto.cardSortFunc = function(a, b) {
	if(a >= 13) a %= 13;
	if(b >= 13) b %= 13;
	var countArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0];
	return countArr.indexOf(b) - countArr.indexOf(a);
};

// 怪牌排序
proto.sortSpecialCard = function(arr) {
	if(this.hasYitiaolong(arr)) {
		return this.sortCardByCountThenColor(arr);
	}
	else if(this.hasLiuduiban(arr)) {
		return this.sortLiuduibanCard(arr);
	}
	else if(this.hasSanhua(arr)) {
		return this.sortSanhuaCard(arr);
	}
	else if(this.hasSanshun(arr)) {
		return this.sortSanshunCard(arr);
	}
};

proto.sortLiuduibanCard = function(arr) {
	var sortArr = [];
	for(var j = 0; j < arr.length; ++j) {
		if(sortArr.indexOf(arr[j]) === -1) {
			for(var k = j+1; k < arr.length; ++k) {
				if(arr[j]%13 === arr[k]%13) {
					sortArr.push(arr[j]);
					sortArr.push(arr[k]);
					break;
				}
			}
			if(k === arr.length) {
				var danpai = arr[j];
			}
		}
	}
	sortArr.push(danpai);
	return sortArr;
};

proto.sortSanhuaCard = function(arr) {
	var array = [];
	for(var i = 0; i < arr.length; ++i) {
		array[i] = arr[i];
	}
	array = this.sortCardByCountThenColor(array);
	var array1 = this.getTonghua(array)[0];
	for(i = 0; i < array1.length; ++i) {
		array.splice(array.indexOf(array1[i]), 1);
	}
	var array2 = this.getTonghua(array)[0];
	for(i = 0; i < array2.length; ++i) {
		array.splice(array.indexOf(array2[i]), 1);
	}
	var sortArr = [];
	for(i = 0; i < array.length; ++i) {
		sortArr.push(array[i]);
	}
	for(i = 0; i < array2.length; ++i) {
		sortArr.push(array2[i]);
	}
	for(i = 0; i < array1.length; ++i) {
		sortArr.push(array1[i]);
	}
	return sortArr;
};

/*
 * 有三顺
 */
proto.hasSanshun = function(cardArr) {
	var tou, zhong, wei;
	var touArr, zhongArr, zhongweiArr, weiArr, restArr;
	var array = [];
	var i;
	for(i = 0; i < cardArr.length; ++i) {
		array[i] = cardArr[i]%13;
	}
	for(tou = 1; tou <= 12; ++ tou) {
		touArr = [tou-1, tou, (tou+1)%13];
		if(this.isContainArray(array, touArr)) {
			zhongweiArr = this.getNotContainArray(array, touArr);
			for(zhong = 2; zhong <= 11; ++ zhong) {
				zhongArr = [zhong-2, zhong-1, zhong, zhong+1, (zhong+2)%13];
				if(this.isContainArray(zhongweiArr, zhongArr)) {
					restArr = this.getNotContainArray(zhongweiArr, zhongArr);
					for(wei = 2; wei <= 11; ++ wei) {
						weiArr = [wei-2, wei-1, wei, wei+1, (wei+2)%13];
						if(this.isContainArray(restArr, weiArr)) {
							return true;
						}
					}
				}

			}
		}
	}
	return false;
};

/*
 * 自动排序三顺牌型
 */
proto.sortSanshunCard = function(cardArr) {
	var tou, zhong, wei;
	var touArr, zhongArr, zhongweiArr, restArr, weiArr;
	var array = [];
	var i, j;
	var canStop = false;
	for(i = 0; i < cardArr.length; ++i) {
		array[i] = cardArr[i]%13;
	}
	for(tou = 1; (tou <= 12) && (! canStop); ++ tou) {
		touArr = [tou-1, tou, (tou+1)%13];
		if(this.isContainArray(array, touArr)) {
			zhongweiArr = this.getNotContainArray(array, touArr);
			for(zhong = 2; (zhong <= 11) && (! canStop); ++ zhong) {
				zhongArr = [zhong-2, zhong-1, zhong, zhong+1, (zhong+2)%13];
				if(this.isContainArray(zhongweiArr, zhongArr)) {
					restArr = this.getNotContainArray(zhongweiArr, zhongArr);
					for(wei = 2; (wei <= 11) && (! canStop); ++ wei) {
						weiArr = [wei-2, wei-1, wei, wei+1, (wei+2)%13];
						if(this.isContainArray(restArr, weiArr)) {
							canStop = true;
							break;
						}
					}
				}

			}
		}
	}
	for(i = 0; i < cardArr.length; ++i) {
		array[i] = cardArr[i];
	}
	var sortArray = [];
	touArr = this.sortCardByCountThenColor(touArr);
	zhongArr = this.sortCardByCountThenColor(zhongArr);
	weiArr = this.sortCardByCountThenColor(weiArr);
	for(i = 0; i < touArr.length; ++i) {
		for(j = 0; j < array.length; ++j) {
			if(array[j]%13 === touArr[i]) {
				sortArray.push(array[j]);
				array.splice(j, 1);
				break;
			}
		}
	}
	for(i = 0; i < zhongArr.length; ++i) {
		for(j = 0; j < array.length; ++j) {
			if(array[j]%13 === zhongArr[i]) {
				sortArray.push(array[j]);
				array.splice(j, 1);
				break;
			}
		}
	}
	for(i = 0; i < weiArr.length; ++i) {
		for(j = 0; j < array.length; ++j) {
			if(array[j]%13 === weiArr[i]) {
				sortArray.push(array[j]);
				array.splice(j, 1);
				break;
			}
		}
	}
	return sortArray;
};

/*
 * array1是否包含array2
 */

proto.isContainArray = function(array1, array2) {
	var i;
	for(i = 0; i < array2.length; ++i) {
		if(array1.indexOf(array2[i]) < 0) {
			break;
		}
	}
	return (i === array2.length);
};

/*
 * 获取不包含的元素数组
 */
proto.getNotContainArray = function(array1, array2) {
	var notContainArray = [];
	var i;
	for(i = 0; i < array1.length; ++i) {
		notContainArray.push(array1[i]);
	}
	for(i = 0; i < array2.length; ++i) {
		notContainArray.splice(notContainArray.indexOf(array2[i]), 1);
	}
	return notContainArray;
};

