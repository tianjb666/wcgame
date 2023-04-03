let utils = require('../../util/utils');
let gameLogic = require('./gameLogic');
let gameProto = require('./BJProto');
let roomProto = require('../../API/Protos/RoomProto');
let scheduler = require('pomelo-scheduler');
let logger = require('pomelo-logger').getLogger('game');


module.exports = function(roomFrame) {
	return new gameFrameSink(roomFrame);
};

let gameFrameSink = function(roomFrame) {
	this.roomFrame = roomFrame;

    this.gameStatus	 = gameProto.gameStatus.NONE;

    this.chipAmount = gameProto.chipAmount;
};

let pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairID, msg){
	let type = msg.type || null;
	let data = msg.data || null;
	if (!type || !data) return;

	if(type === gameProto.GAME_USER_BET_NOTIFY) {
        this.onUserBet(chairID, data);
	}else if(type === gameProto.GAME_USER_CUT_CARD_NOTIFY){
        this.onUserCutCard(chairID, data);
    }else if (type === gameProto.GAME_USER_DOUBLE_BET_NOTIFY){
        this.onUserDoubleBet(chairID, data);
    }else if (type === gameProto.GAME_USER_ADD_CARD_NOTIFY){
        this.onUserAddCard(chairID, data);
    }else if (type === gameProto.GAME_USER_STOP_CARD_NOTIFY){
        this.onUserStopCard(chairID, data);
    }else if (type === gameProto.GAME_USER_BUY_INSURANCE_NOTIFY){
	    this.onUserBuyInsurance(chairID, data);
    }
};

pro.resetGame = function () {
    this.gameStatus	 = gameProto.gameStatus.NONE;

    this.leftAllCardData = null;

    this.bankerCardArr = [];
    this.allUserCardArr = [];

    this.betCountArr = [];

    this.doubleBetStatusArr = [];
    this.stopCardStatusArr = [];

    this.playingStatusArr = [];

    this.buyInsuranceStatus = [];

    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        this.betCountArr[i] = 0;
        this.doubleBetStatusArr[i] = [false, null];
        this.stopCardStatusArr[i] = [false, null];
        this.playingStatusArr[i] = false;
        this.buyInsuranceStatus[i] = null;
    }
};

// 开始游戏
pro.startGame = function() {
    this.resetGame();
    this.gameStatus	 = gameProto.gameStatus.WAIT_BET;
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        let user = this.roomFrame.getUserByChairId(i);
        this.playingStatusArr[i] = !!user;
    }
    this.roomFrame.sendDataToAll(gameProto.gameStartPush(this.playingStatusArr));

    
    for (let i = 0; i < this.playingStatusArr.length; ++i){
        if (!this.playingStatusArr[i]) continue;
        let user = this.roomFrame.getUserByChairId(i);
        // 开始机器人操作
        if (user.userInfo.robot){
            this.robotAutoOperation(i);
        }
        // 开始离线玩家操作
        if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) !== 0) {
            this.offlineUserAutoOperation(i);
        }
    }
};

// 游戏结束
pro.gameEnd = function () {
    let scoreChangeArr = [];
    let endData = [];
    let bankerBlackJack = gameLogic.isBlackJack(this.bankerCardArr);
    for (let i = 0; i < this.playingStatusArr.length; ++i){
        if (this.playingStatusArr[i]){
            let score = 0;
            let cardDataArr = this.allUserCardArr[i];
            // 计算保险
            if (bankerBlackJack){
                if (this.buyInsuranceStatus[i]){
                    score += 0.5;
                }
            }else{
                if (this.buyInsuranceStatus[i]){
                    score -= 0.5;
                }
            }
            // 计算比牌分数
            if (cardDataArr[0]){
                let winner = gameLogic.deduceWiner(this.bankerCardArr, cardDataArr[0]);
                if (winner === 1 && gameLogic.isBlackJack(cardDataArr[0])){
                    score += ((this.doubleBetStatusArr[i][0]?2:1)) * 1.5;
                }else{
                    score += (winner * (this.doubleBetStatusArr[i][0]?2:1));
                }
            }
            if (cardDataArr[1]){
                let winner = gameLogic.deduceWiner(this.bankerCardArr, cardDataArr[1]);
                if (winner === 1 && gameLogic.isBlackJack(cardDataArr[1])){
                    score += winner * 1.5;
                }else{
                    score += winner;
                }
            }
            score *= this.betCountArr[i];
            scoreChangeArr[i] = score;
            endData.push({
                uid: this.roomFrame.getUserByChairId(i).userInfo.uid,
                score: score
            });
        }else{
            scoreChangeArr[i] = 0;
        }
    }

    this.roomFrame.sendDataToAll(gameProto.gameResultPush(this.bankerCardArr, this.allUserCardArr, scoreChangeArr));

    this.roomFrame.writeUserGameResult(endData);

    setTimeout(function () {
        if (!this.roomFrame) return;
        this.roomFrame.concludeGame([]);
        this.resetGame();
    }.bind(this), 3 * 1000);

    /*this.resetGame();

    this.roomFrame.concludeGame(endData);*/
};

// 下注
pro.onUserBet = function (chairID, data) {
    if (this.gameStatus !== gameProto.gameStatus.WAIT_BET) {
        logger.error('onUserBet err: status err');
        return;
    }
    if (!this.playingStatusArr[chairID]){
        logger.error('onUserBet err: user not playing');
        return;
    }
    if (!!this.betCountArr[chairID]) {
        logger.error('onUserBet err: user already bet');
        return;
    }
    if (typeof data.count !== 'number' || data.count < 0){
        logger.error('onUserBet err: count=' + data.count);
        return;
    }
    let user = this.roomFrame.getUserByChairId(chairID);
    if (user.userInfo.gold < data.count){
        logger.error('onUserBet err: gold not enought');
        return;
    }

    this.betCountArr[chairID] = data.count;

    this.roomFrame.sendDataToAll(gameProto.gameUserBetPush(chairID, data.count));

    // 检测是否全部已经下注
    let isAllBet = true;
    for (let i = 0; i < this.betCountArr.length; ++i){
        if (this.playingStatusArr[i] && !this.betCountArr[i]){
            isAllBet = false;
            break;
        }
    }
    if(isAllBet){
        this.sendCard();
    }
};

pro.sendCard = function(){
    // 洗牌
    this.leftAllCardData = gameLogic.getRandCardList();
    // 发庄家牌
    this.bankerCardArr = this.leftAllCardData.splice(this.leftAllCardData.length - 2, 2);
    // 发牌推送
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        let user = this.roomFrame.getUserByChairId(i);
        if (user){
            let cardArr = this.leftAllCardData.splice(this.leftAllCardData.length - 2, 2);
            this.allUserCardArr.push([cardArr, null]);
        }else{
            this.allUserCardArr.push(null);
        }
    }

    // 判断是否要买保险
    if (gameLogic.getCardValue(this.bankerCardArr[0]) === 11){
        this.gameStatus = gameProto.gameStatus.WAIT_BUY_INSURANCE;
        this.roomFrame.sendDataToAll(gameProto.gameSendCardPush([this.bankerCardArr[0]], this.allUserCardArr));
        // 机器人操作
        for (let i = 0; i < this.playingStatusArr.length; ++i){
            if (!this.playingStatusArr[i]) continue;
            if (this.stopCardStatusArr[i][0] !== false) continue;
            let user = this.roomFrame.getUserByChairId(i);
            if (user.userInfo.robot){
                this.robotAutoOperation(i);
            }
            // 开始离线玩家操作
            if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) !== 0) {
                this.offlineUserAutoOperation(i);
            }
        }
    }else{
        let points = gameLogic.getCardPoint(this.bankerCardArr);
        if (points === 21){
            this.roomFrame.sendDataToAll(gameProto.gameSendCardPush(this.bankerCardArr, this.allUserCardArr));
            // 游戏结束
            this.gameEnd();
        }else{
            this.gameStatus = gameProto.gameStatus.PLAYING;
            this.roomFrame.sendDataToAll(gameProto.gameSendCardPush([this.bankerCardArr[0]], this.allUserCardArr));
            for (let i = 0; i < this.playingStatusArr.length; ++i){
                if (!this.playingStatusArr[i]) continue;
                let cardDataArr = this.allUserCardArr[i][0];
                if (gameLogic.getCardPoint(cardDataArr) === 21){
                    this.stopCardStatusArr[i][0] = true;
                }
            }
            // 判定是否所有玩家操作都已结束
            if (this.checkUserOperateEnd()){
                this.startBankerOperate();
            }else{
                // 机器人操作
                for (let i = 0; i < this.playingStatusArr.length; ++i){
                    if (!this.playingStatusArr[i]) continue;
                    if (this.stopCardStatusArr[i][0] !== false) continue;
                    let user = this.roomFrame.getUserByChairId(i);
                    if (user.userInfo.robot){
                        this.robotAutoOperation(i);
                    }
                    // 开始离线玩家操作
                    if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) !== 0) {
                        this.offlineUserAutoOperation(i);
                    }
                }
            }
        }
    }
};

pro.onUserCutCard = function(chairID){
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) {
        logger.error('onUserCutCard err: status err');
        return;
    }
    if (!this.playingStatusArr[chairID]){
        logger.error('onUserCutCard err: chairID err');
        return;
    }
    let cardDataArr = this.allUserCardArr[chairID];
    if (!cardDataArr || !!cardDataArr[1]){
        logger.error('onUserCutCard err: already cut card');
        return;
    }
    if (this.stopCardStatusArr[chairID][0]){
        logger.error('onUserCutCard err: already stop card');
        return;
    }

    // 判定金币是否足够
    let user = this.roomFrame.getUserByChairId(chairID);
    let totalCount = this.betCountArr[chairID] * 2;
    if (!!this.buyInsuranceStatus[chairID]){
        totalCount += this.betCountArr[chairID] * 0.5;
    }
    if (!user || user.userInfo.gold < totalCount){
        logger.error('onUserBet err: gold not enought');
        return;
    }

    if (!gameLogic.isCanCutCard(cardDataArr[0])){
        logger.error('onUserCutCard err: can not cut');
        return;
    }
    let newCardLeft = this.leftAllCardData.pop();
    let newCardRight = this.leftAllCardData.pop();
    let card2 = cardDataArr[0][1];
    cardDataArr[0] = [cardDataArr[0][0], newCardLeft];
    cardDataArr[1] = [card2, newCardRight];

    this.stopCardStatusArr[chairID][1] = false;
    // 拿到21则直接停牌
    if (gameLogic.getCardPoint(cardDataArr[0]) >= 21){
        this.stopCardStatusArr[chairID][0] = true;
    }
    if (gameLogic.getCardPoint(cardDataArr[1]) >= 21){
        this.stopCardStatusArr[chairID][1] = true;
    }

    // 推送分牌操作
    this.roomFrame.sendDataToAll(gameProto.gameUserCutCardPush(chairID, cardDataArr));

    // 判定是否所有玩家操作都已结束
    if (this.checkUserOperateEnd()){
        this.startBankerOperate();
    }else{
        // 开始离线玩家操作
        if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) !== 0) {
            this.offlineUserAutoOperation(chairID);
        }
    }
};

pro.onUserDoubleBet = function(chairID, data){
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) {
        logger.error('onUserDoubleBet err: status err');
        return;
    }
    if (!this.playingStatusArr[chairID]){
        logger.error('onUserDoubleBet err: chairID err');
        return;
    }
    let cardDataArr = this.allUserCardArr[chairID];
    if (!cardDataArr || !cardDataArr[data.index] || !!cardDataArr[1] || data.index !== 0){
        logger.error('onUserDoubleBet err: not card index=' + data.index);
        return;
    }
    if (this.stopCardStatusArr[chairID][data.index]){
        logger.error('onUserDoubleBet err: already stop card');
        return;
    }
    if (!!this.doubleBetStatusArr[chairID][data.index]){
        logger.error('onUserDoubleBet err: already double card');
        return;
    }
    // 计算金币
    let totalGold = 0;
    totalGold += this.betCountArr[chairID] * 2;
    if (!!this.buyInsuranceStatus[chairID]){
        totalGold += this.betCountArr[chairID] * 0.5;
    }
    console.info("totalGold", totalGold);
    let user = this.roomFrame.getUserByChairId(chairID);
    if (!user || user.userInfo.gold < totalGold){
        logger.error('onUserBet err: gold not enought');
        return;
    }

    // 修改翻倍状态
    this.doubleBetStatusArr[chairID][data.index] = true;
    // 发牌
    cardDataArr[data.index].push(this.leftAllCardData.pop());
    // 发送翻倍消息
    this.roomFrame.sendDataToAll(gameProto.gameUserDoubleBetPush(chairID, data.index, cardDataArr));
    // 停牌
    this.stopCardStatusArr[chairID][data.index] = true;
    // 判定是否所有玩家操作都已结束
    if (this.checkUserOperateEnd()){
        this.startBankerOperate();
    }
};

pro.onUserAddCard = function(chairID, data){
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) {
        logger.error('onUserAddCard err: status err');
        return;
    }
    if (!this.playingStatusArr[chairID]){
        logger.error('onUserAddCard err: chairID err');
        return;
    }
    let cardDataArr = this.allUserCardArr[chairID];
    if (!cardDataArr || !cardDataArr[data.index]){
        logger.error('onUserAddCard err: not card index=' + data.index);
        return;
    }
    if (this.stopCardStatusArr[chairID][data.index]){
        logger.error('onUserAddCard err: already stop card');
        return;
    }
    // 发牌
    cardDataArr[data.index].push(this.leftAllCardData.pop());
    // 发送翻倍消息
    this.roomFrame.sendDataToAll(gameProto.gameUserAddCardPush(chairID, data.index, cardDataArr));
    // 停牌
    let point = gameLogic.getCardPoint(cardDataArr[data.index]);
    if (point >= 21){
        this.stopCardStatusArr[chairID][data.index] = true;
    }else{
        // 机器人操作
        let user = this.roomFrame.getUserByChairId(chairID);
        if (user.userInfo.robot){
            this.robotAutoOperation(chairID);
        }
    }
    // 判定是否所有玩家操作都已结束
    if (this.checkUserOperateEnd()){
        this.startBankerOperate();
    }else{
        // 开始离线玩家操作
        let user = this.roomFrame.getUserByChairId(chairID);
        if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) !== 0) {
            this.offlineUserAutoOperation(chairID);
        }
    }
};

pro.userBustCard = function(chairID){
    this.allUserCardArr[chairID] = [null, null];

    let betCount = this.betCountArr[chairID];
    if (!this.doubleBetStatusArr[chairID][0]) betCount *= 2;
    if (!!this.allUserCardArr[chairID][1]) betCount *= 2;
    this.betCountArr[chairID] = 0;

    this.doubleBetStatusArr[chairID] = [null, null];
    this.stopCardStatusArr[chairID] = [true, null];

    this.playingStatusArr[chairID] = false;

    this.roomFrame.recordGameResult([{
        uid: this.roomFrame.getUserByChairId(chairID).userInfo.uid,
        score: -betCount
    }])
};

pro.onUserStopCard = function(chairID, data){
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) {
        logger.error('onUserStopCard err: status err');
        return;
    }
    if (!this.playingStatusArr[chairID]){
        logger.error('onUserStopCard err: chairID err');
        return;
    }
    let cardDataArr = this.allUserCardArr[chairID];
    if (!cardDataArr || !cardDataArr[data.index]){
        logger.error('onUserStopCard err: not card index=' + data.index);
        return;
    }
    if (this.stopCardStatusArr[chairID][data.index]){
        logger.error('onUserStopCard err: already stop card');
        return;
    }
    // 发送翻倍消息
    this.roomFrame.sendDataToAll(gameProto.gameUserStopCardPush(chairID, data.index));
    // 停牌
    this.stopCardStatusArr[chairID][data.index] = true;
    // 判定是否所有玩家操作都已结束
    if (this.checkUserOperateEnd()){
        this.startBankerOperate();
    }
};

pro.onUserBuyInsurance = function(chairID, data){
    if (this.gameStatus !== gameProto.gameStatus.WAIT_BUY_INSURANCE) {
        logger.error('onUserBuyInsurance err: status err');
        return;
    }
    if (!this.playingStatusArr[chairID]){
        logger.error('onUserBuyInsurance err: chairID err');
        return;
    }
    if (this.buyInsuranceStatus[chairID] !== null){
        logger.error('onUserBuyInsurance err: already stop card');
        return;
    }
    // 验证金币是否足够
    if (data.isBuy){
        let user = this.roomFrame.getUserByChairId(chairID);
        if (!user || (user.userInfo.gold < this.betCountArr[chairID] * 1.5)){
            logger.error('onUserBuyInsurance err: gold not enought');
        }
    }

    this.buyInsuranceStatus[chairID] = data.isBuy;

    this.roomFrame.sendDataToAll(gameProto.gameUserByInsurancePush(chairID, data.isBuy));

    // 判断是否所有玩家都已经操作结束
    let allFinished = true;
    for (let i = 0; i < this.buyInsuranceStatus.length; ++i){
        if (!this.playingStatusArr[i]) continue;
        if (this.buyInsuranceStatus[i] === null) {
            allFinished = false;
            break;
        }
    }
    if (allFinished){
        // 计算保险结果
        this.insuranceResult();
    }
};

pro.insuranceResult = function(){
    let points = gameLogic.getCardPoint(this.bankerCardArr);
    if (points !== 21){
        this.roomFrame.sendDataToAll(gameProto.gameInsuranceResultPush());
        this.gameStatus = gameProto.gameStatus.PLAYING;
        for (let i = 0; i < this.playingStatusArr.length; ++i){
            if (!this.playingStatusArr[i]) continue;
            let cardDataArr = this.allUserCardArr[i][0];
            if (gameLogic.getCardPoint(cardDataArr) === 21){
                this.stopCardStatusArr[i][0] = true;
            }
        }
        // 判定是否所有玩家操作都已结束
        if (this.checkUserOperateEnd()){
            this.startBankerOperate();
        }else{
            // 机器人操作
            for (let i = 0; i < this.playingStatusArr.length; ++i){
                if (!this.playingStatusArr[i]) continue;
                if (this.stopCardStatusArr[i][0] !== false) continue;
                let user = this.roomFrame.getUserByChairId(i);
                if (user.userInfo.robot){
                    this.robotAutoOperation(i);
                }
                // 开始离线玩家操作
                if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) !== 0) {
                    this.offlineUserAutoOperation(i);
                }
            }
        }

    }else{
        this.gameEnd();
    }
};

// 判断玩家操作是否结束
pro.checkUserOperateEnd = function(){
    for (let i = 0; i < this.playingStatusArr.length; ++i){
        if (!this.playingStatusArr[i]) continue;
        if (this.stopCardStatusArr[i][0] === false || this.stopCardStatusArr[i][1] === false) return false;
    }
    return true;
};

// 庄家拿牌，拿牌后结束
pro.startBankerOperate = function(){
    // 判断是否所有玩家都已经爆牌
    let temp = true;
    for (let i = 0; i < this.allUserCardArr.length; ++i){
        if (!this.playingStatusArr[i]) continue;
        let userCardArr = this.allUserCardArr[i];
        if(!!userCardArr[0] && gameLogic.getCardPoint(userCardArr[0]) <= 21) {
            temp = false;
            break;
        }
        if(!!userCardArr[1] && gameLogic.getCardPoint(userCardArr[1]) <= 21) {
            temp = false;
            break;
        }
    }
    if (!temp){
        while(gameLogic.getCardPoint(this.bankerCardArr) < 17){
            this.bankerCardArr.push(this.leftAllCardData.pop());
        }
    }
    this.gameEnd();
};

// --------------------- 离线操作 -----------------------------
pro.offlineUserAutoOperation = function (chairID) {
    if (!this.playingStatusArr[chairID]) return;
    if (this.gameStatus === gameProto.gameStatus.WAIT_BET){
        if (this.betCountArr[chairID]) return;
        setTimeout(function(){
            if (this.gameStatus !== gameProto.gameStatus.WAIT_BET) return;
            if (this.betCountArr[chairID]) return;
            let user = this.roomFrame.getUserByChairId(chairID);
            if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0) return;
            this.receivePlayerMessage(chairID, gameProto.gameUserBetNotify(this.chipAmount[0]));
        }.bind(this), utils.getRandomNum(1, 3) * 1000);
    }else if (this.gameStatus === gameProto.gameStatus.PLAYING){
        if (this.stopCardStatusArr[chairID][0] !== false && this.stopCardStatusArr[chairID][1] !== false) return;
        setTimeout(function(){
            if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
            if (this.stopCardStatusArr[chairID][0] !== false && this.stopCardStatusArr[chairID][1] !== false) return;
            let user = this.roomFrame.getUserByChairId(chairID);
            if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0) return;
            if (this.stopCardStatusArr[chairID][0] === false){
                this.receivePlayerMessage(chairID, gameProto.gameUserStopCardNotify(0));
            }else if (this.stopCardStatusArr[chairID][1] === false){
                this.receivePlayerMessage(chairID, gameProto.gameUserStopCardNotify(1));
            }
        }.bind(this), utils.getRandomNum(1, 3) * 1000);
    }else if (this.gameStatus === gameProto.gameStatus.WAIT_BUY_INSURANCE){
        if (this.buyInsuranceStatus[chairID] !== null) return;
        setTimeout(function(){
            if (this.gameStatus !== gameProto.gameStatus.WAIT_BUY_INSURANCE) return;
            if (this.buyInsuranceStatus[chairID] !== null) return;
            let user = this.roomFrame.getUserByChairId(chairID);
            if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0) return;
            this.receivePlayerMessage(chairID, gameProto.gameUserByInsuranceNotify(false));
        }.bind(this), utils.getRandomNum(1, 3) * 1000);
    }
};

// --------------------- 机器人操作 -----------------------------
pro.robotAutoOperation = function (chairID) {
    let user = this.roomFrame.getUserByChairId(chairID);
    if (!user || !user.userInfo.robot) return;
    if (!this.playingStatusArr[chairID]) return;
    if (this.gameStatus === gameProto.gameStatus.WAIT_BET){
        if (this.betCountArr[chairID]) return;
        setTimeout(function(){
            if (this.gameStatus !== gameProto.gameStatus.WAIT_BET) return;
            if (this.betCountArr[chairID]) return;
            let gold = user.userInfo.gold;
            let maxIndex = 0;
            for (let i = 0; i < this.chipAmount.length; ++i){
                if (this.chipAmount[i] <= gold){
                    maxIndex = i;
                }
            }
            this.receivePlayerMessage(chairID, gameProto.gameUserBetNotify(this.chipAmount[maxIndex === 0?0:utils.getRandomNum(0, maxIndex)]));
        }.bind(this), utils.getRandomNum(3000, 5000));
    }else if (this.gameStatus === gameProto.gameStatus.PLAYING){
        if (this.stopCardStatusArr[chairID][0]) return;
        setTimeout(function(){
            if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
            if (this.stopCardStatusArr[chairID][0]) return;
            let stopCardPoint = utils.getRandomNum(15, 18);
            if (gameLogic.getCardPoint(this.allUserCardArr[chairID][0]) >= stopCardPoint){
                this.receivePlayerMessage(chairID, gameProto.gameUserStopCardNotify(0));
            }else{
                this.receivePlayerMessage(chairID, gameProto.gameUserAddCardNotify(0));
            }
        }.bind(this), utils.getRandomNum(3000, 5000));
    }else if (this.gameStatus === gameProto.gameStatus.WAIT_BUY_INSURANCE){
        if (this.buyInsuranceStatus[chairID]) return;
        setTimeout(function(){
            if (this.gameStatus !== gameProto.gameStatus.WAIT_BUY_INSURANCE) return;
            if (this.buyInsuranceStatus[chairID]) return;
            this.receivePlayerMessage(chairID, gameProto.gameUserByInsuranceNotify(false));
        }.bind(this), utils.getRandomNum(3000, 5000));
    }
};

/**************************************************************************************
 * room interface
 */
/* 玩家进入游戏时数据 */
pro.getEnterGameData = function() {
    let gameData = {
        gameStatus: this.gameStatus,
        baseScore: this.roomFrame.gameTypeInfo.baseScore,
        gameTypeInfo: this.roomFrame.gameTypeInfo,
        profitPercentage: this.roomFrame.gameTypeInfo.level ===0?0:parseInt(this.roomFrame.publicParameter["profitPercentage"] || 5)
    };
    if (this.gameStatus === gameProto.gameStatus.NONE){
        return gameData;
    }else if (this.gameStatus === gameProto.gameStatus.WAIT_BET){
        gameData.playingStatusArr = this.playingStatusArr;
        gameData.betCountArr = this.betCountArr;
        return gameData;
    }else if (this.gameStatus === gameProto.gameStatus.WAIT_BUY_INSURANCE){
        gameData.playingStatusArr = this.playingStatusArr;
        gameData.betCountArr = this.betCountArr;
        gameData.buyInsuranceStatus = this.buyInsuranceStatus;
        gameData.allUserCardArr = this.allUserCardArr;
        gameData.bankerCardArr = [this.bankerCardArr[0]];
        return gameData;
    }else{
        gameData.betCountArr = this.betCountArr;
        gameData.bankerCardArr = [this.bankerCardArr[0]];
        gameData.allUserCardArr = this.allUserCardArr;
        gameData.doubleBetStatusArr = this.doubleBetStatusArr;
        gameData.stopCardStatusArr = this.stopCardStatusArr;
        gameData.playingStatusArr = this.playingStatusArr;
        gameData.buyInsuranceStatus = this.buyInsuranceStatus;
        return gameData;
    }
};

pro.onEventGamePrepare = function(cb) {
	if(cb) cb();
};

pro.onEventGameStart = function(cb) {
	this.startGame();
	if(cb) cb();
};

pro.onEventUserEntry = function(entryUserChairId, cb) {
	if(cb) cb();
};

pro.onEventUserLeave = function(leaveUserChairId, cb) {
	if(cb) cb();
};

pro.isUserEnableLeave = function() {
    return (this.gameStatus === gameProto.gameStatus.NONE);
};

pro.onEventUserOffLine = function(offLineUserChairId, cb) {
    this.offlineUserAutoOperation(offLineUserChairId);
	if(cb) cb();
};

pro.onEventRoomDismiss = function() {
};