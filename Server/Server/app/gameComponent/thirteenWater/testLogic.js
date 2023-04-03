var gameLogic = require('./gameLogic');
var tg = module.exports;

tg.cardTypeCount = {
	duizi: 0,
	liangdui: 0,
	santiao: 0,
	shunzi: 0,
	tonghua: 0,
	hulu: 0,
	sitiao: 0,
	tonghuashun: 0,
	liuduiban: 0,
	sanhua: 0,
	sanshun: 0,
	yitiaolong: 0
};

tg.beginTest = function(times) {
	for(var i = 0; i < times; ++i) {
		var cardsArr = gameLogic.getCardsArr();
		for(var j = 0; j < cardsArr.length; ++j) {
			if(! this.testCardArr(cardsArr[j])) {
				console.log(cardsArr[j]);
				return;
			}
		}
	}
	console.log(this.cardTypeCount);
};

tg.testCardArr = function(cardArr) {
	if(gameLogic.hasYitiaolong(cardArr)) {
		++ this.cardTypeCount.yitiaolong;
	}
	if(gameLogic.hasSanhua(cardArr)) {
		++ this.cardTypeCount.sanhua;
	}
	if(gameLogic.hasSanshun(cardArr)) {
		++ this.cardTypeCount.sanshun;
	}
	if(gameLogic.hasLiuduiban(cardArr)) {
		++ this.cardTypeCount.liuduiban;
	}
	if(gameLogic.hasTonghuashun(cardArr)) {
		++ this.cardTypeCount.tonghuashun;
		var resout = gameLogic.getTonghuashun(cardArr);
		if(!this.verifyResout(resout, 'tonghuashun')) {
			//console.log('tonghuashun');
			return false;
		}
	}
	if(gameLogic.hasSitiao(cardArr)) {
		++ this.cardTypeCount.sitiao;
		var resout = gameLogic.getSitiao(cardArr);
		if(!this.verifyResout(resout, 'sitiao')) {
			//console.log('sitiao');
			return false;
		}
	}
	if(gameLogic.hasHulu(cardArr)) {
		++ this.cardTypeCount.hulu;
		var resout = gameLogic.getHulu(cardArr);
		if(!this.verifyResout(resout, 'hulu')) {
			//console.log('hulu');
			return false;
		}
	}
	if(gameLogic.hasTonghua(cardArr)) {
		++ this.cardTypeCount.tonghua;
		var resout = gameLogic.getTonghua(cardArr);
		if(!this.verifyResout(resout, 'tonghua')) {
			//console.log('tonghua');
			return false;
		}
	}
	if(gameLogic.hasShunzi(cardArr)) {
		++ this.cardTypeCount.shunzi;
		var resout = gameLogic.getShunzi(cardArr);
		if(!this.verifyResout(resout, 'shunzi')) {
			//console.log('shunzi');
			return false;
		}
	}
	if(gameLogic.hasSantiao(cardArr)) {
		++ this.cardTypeCount.santiao;
		var resout = gameLogic.getSantiao(cardArr);
		if(!this.verifyResout(resout, 'santiao')) {
			//console.log('santiao');
			return false;
		}
	}
	if(gameLogic.hasLiangdui(cardArr)) {
		++ this.cardTypeCount.liangdui;
		var resout = gameLogic.getLiangdui(cardArr);
		if(!this.verifyResout(resout, 'liangdui')) {
			//console.log('liangdui');
			return false;
		}
	}
	if(gameLogic.hasDuizi(cardArr)) {
		++ this.cardTypeCount.duizi;
		var resout = gameLogic.getDuizi(cardArr);
		if(!this.verifyResout(resout, 'duizi')) {
			//console.log('duizi');
			return false;
		}
	}
	return true;
};

tg.verifyResout = function(resout, type) {
	var callFunc;
	if(type === 'tonghuashun') {
		callFunc = gameLogic.hasTonghuashun;
	}
	else if(type === 'sitiao') {
		callFunc = gameLogic.hasSitiao;
	}
	else if(type === 'hulu') {
		callFunc = gameLogic.hasHulu;
	}
	else if(type === 'tonghua') {
		callFunc = gameLogic.hasTonghua;
	}
	else if(type === 'shunzi') {
		callFunc = gameLogic.hasShunzi;
	}
	else if(type === 'santiao') {
		callFunc = gameLogic.hasSantiao;
	}
	else if(type === 'liangdui') {
		callFunc = gameLogic.hasLiangdui;
	}
	else if(type === 'duizi') {
		callFunc = gameLogic.hasDuizi;
		//console.log(resout);
	}
	if(resout.length === 0) {
		return false;
	}
	for(var i = 0; i < resout.length; ++i) {
		if(resout[i].length !== 5) {
			return false;
		}
		if(callFunc && !callFunc.call(gameLogic, resout[i])) {
			return false;
		}
	}
	return true;
};

this.beginTest(10000);

