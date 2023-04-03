let utils = require('../../util/utils');
let gameLogic = require('./PDKGameLogic');
let gameProto = require('./PDKProto');
let roomProto = require('../../API/Protos/RoomProto');
let logger = require('pomelo-logger').getLogger('game');
let aiLogic = require('./aiLogic');


module.exports = function(roomFrame) {
	return new gameFrameSink(roomFrame);
};

let gameFrameSink = function(roomFrame) {
	this.roomFrame = roomFrame;

    this.resetGame();
};

let pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairID, msg){
	let type = msg.type || null;
	let data = msg.data || null;
	if (!type || !data) return;

	if(type === gameProto.GAME_USER_OUT_CARD_NOTIFY){
	    this.onUserOutCard(chairID, data);
    }else if (type === gameProto.GAME_USER_PASS_NOTIFY){
	    this.onUserPass(chairID);
    }
};

pro.resetGame = function () {
    this.gameStatus	 = gameProto.gameStatus.NONE;
    this.landScore = 0;
    this.bombTimesArr = [0, 0, 0];
    this.outBombChairID = -1;
    this.curChairID = -1;
    this.firstChairID = -1;
    this.curChairCanPass = false;
    this.baoPeiChairID = -1;

    // 出牌信息
    this.turnWinerChairID = -1;
    this.turnCardDataArr = [];

    this.allUserCardArr = [];
    this.outCardTimesArr = [0, 0 ,0];
    this.outCardDataArr = [];
};

// 开始游戏
pro.startGame = function() {
    this.gameStatus = gameProto.gameStatus.OUT_CARD;

    // 洗牌
    let allCardData = gameLogic.getRandCardList();
    // 发牌
    for (let i = 0; i< 3; ++i){
        let cardArr = gameLogic.sortCardList(allCardData.slice(i * 16, i * 16 + 16));
        this.allUserCardArr.push(cardArr);
    }
    // 调整牌
    /*let rate = this.roomFrame.getCurRobotWinRate();
    if (Math.random() < rate){
        let robotArr = [false, false, false];
        for (let j = 0; j < 3; ++j){
            let user1 = this.roomFrame.getUserByChairId(j)
            if (!!user1 && user1.userInfo.robot){
                robotArr[j] = true;
            }
        }
        aiLogic.reSortCard(this.allUserCardArr, robotArr);
    }*/
    // 查询先手玩家
    this.curChairID = -1;
    for (let i = 0; i < this.allUserCardArr.length; ++i){
        if (gameLogic.isFirstOut(this.allUserCardArr[i])){
            this.curChairID = i;
        }
    }
    this.firstChairID = this.curChairID;
    // 发牌推送
    for (let i = 0; i < 3; ++i){
        this.roomFrame.sendData(gameProto.gameStartPush(this.curChairID, this.allUserCardArr[i]), [i]);
    }
    // 判断是否是机器人开始叫分
    let user = this.roomFrame.getUserByChairId(this.curChairID);
    if (user.userInfo.robot){
        this.robotOutCard(this.curChairID);
    }
    // 判断是否是离线玩家开始出牌
    else if ((user.userStatus & roomProto.userStatusEnum.OFFLINE) !== 0){
        this.offlineUserAutoOperation(this.curChairID);
    }
};

// 游戏结束
pro.gameEnd = function (winChairID) {
    //变量定义
    let baseScore = this.roomFrame.gameTypeInfo.baseScore;

    //游戏积分
    let scoreChangeArr = [0, 0, 0];
    let endData = [];
    //统计积分
    for (let i = 0; i < 3; i++ ){
        if (winChairID === i) continue;
        let cardDataArr = this.allUserCardArr[i];
        let score = cardDataArr.length * baseScore;
        if (this.outCardTimesArr[i] === 0 || (this.outCardTimesArr[i] === 1 && this.firstChairID === i)) score *= 2;
        scoreChangeArr[i] -= score;
        scoreChangeArr[winChairID] += score;
    }
    // 计算包赔
    if (this.baoPeiChairID !== -1 && this.baoPeiChairID !== winChairID){
        for (let i = 0; i < scoreChangeArr.length; ++i){
            if (i === winChairID || i === this.baoPeiChairID) continue;
            if (i !== this.baoPeiChairID){
                scoreChangeArr[this.baoPeiChairID] += scoreChangeArr[i];
                scoreChangeArr[i] = 0;
            }
        }
    }
    // 计算炸弹奖励(放炸弹获得十倍底分奖励)
    let bombScoreChangeArr = [0, 0, 0];
    for (let i = 0; i < 3; ++i){
        if (this.bombTimesArr[i] > 0){
            bombScoreChangeArr[i] += (this.bombTimesArr[i] * baseScore * 10);
            for (let j = 0; j < 3; ++j){
                if (j === i) continue;
                bombScoreChangeArr[j] -= (this.bombTimesArr[i] * baseScore * 5);
            }
        }
    }
    let nicknameArr = [];
    for (let i = 0; i < 3; ++i){
        let user = this.roomFrame.getUserByChairId(i);
        nicknameArr.push(!!user?user.userInfo.nickname:"");
    }
    this.roomFrame.sendDataToAll(gameProto.gameResultPush(this.allUserCardArr, scoreChangeArr, bombScoreChangeArr, winChairID, nicknameArr));

    this.resetGame();

    for (let i = 0; i < 3; ++i){
        endData.push({
            uid: this.roomFrame.getUserByChairId(i).userInfo.uid,
            score: scoreChangeArr[i] + bombScoreChangeArr[i]
        });
    }
    this.roomFrame.concludeGame(endData);
};

// 出牌
pro.onUserOutCard = function (chairID, data) {
    if (this.gameStatus !== gameProto.gameStatus.OUT_CARD) {
        logger.error('onUserOutCard err: status err');
        return;
    }

    if (chairID !== this.curChairID) {
        logger.error('onUserOutCard err: chairID !== curChairID');
        return;
    }

    let cardDataArr = gameLogic.sortCardList(data.outCardArr);
    let cardType = gameLogic.getCardType(cardDataArr);
    if (cardType === gameProto.cardType.ERROR){
        logger.error('userSnatchLandlord err: card type error');
        console.error(data.outCardArr);
        return;
    }

    // 比较牌型
    if (this.turnCardDataArr.length !== 0 && !gameLogic.compareCard(this.turnCardDataArr, cardDataArr)) {
        logger.error('userSnatchLandlord err: compare err');
        return;
    }

    // 删除扑克牌
    if (gameLogic.removeCard(cardDataArr, this.allUserCardArr[chairID])=== false){
        logger.error('userSnatchLandlord err: removeCard err');
        return;
    }

    // 记录出牌
    this.turnCardDataArr = cardDataArr.slice();
    this.turnWinerChairID = chairID;
    this.outCardDataArr = this.outCardDataArr.concat(cardDataArr);
    this.outCardTimesArr[chairID]++;

    // 炸弹判断
    this.outBombChairID = -1;
    if (cardType === gameProto.cardType.BOMB_CARD) {
        this.outBombChairID = chairID;
    }


    // 切换用户
    if (this.allUserCardArr[chairID].length === 0){
        this.curChairID = -1;
    }else{
        this.curChairID = (this.curChairID + 1)%3;
        // 计算是否包赔
        this.baoPeiChairID = -1;
        if (cardType === gameProto.cardType.SINGLE && this.allUserCardArr[this.curChairID].length === 1){
            let isMaxCard = true;
            let outCardLogicValue = gameLogic.getCardLogicValue(cardDataArr[0]);
            let lastUserCardDataArr = this.allUserCardArr[chairID];
            for (let i = 0; i < lastUserCardDataArr.length; ++i){
                if (gameLogic.getCardLogicValue(lastUserCardDataArr[i]) > outCardLogicValue){
                    isMaxCard = false;
                    break;
                }
            }
            if (!isMaxCard) this.baoPeiChairID = chairID;
        }
        // 判断当前用户是否可以pass
        let resultCardArr = gameLogic.searchOutCard(this.allUserCardArr[this.curChairID], this.turnCardDataArr);
        this.curChairCanPass = (!resultCardArr || resultCardArr.length === 0);

        // 判断是否是机器人开始出牌
        let user = this.roomFrame.getUserByChairId(this.curChairID);
        if (user.userInfo.robot){
            this.robotOutCard(this.curChairID);
        }
        // 判断是否是离线玩家开始出牌
        else if ((user.userStatus & roomProto.userStatusEnum.OFFLINE) !== 0){
            this.offlineUserAutoOperation(this.curChairID);
        }
    }

    // 玩家出牌推送
    this.roomFrame.sendDataToAll(gameProto.gameUserOutCardPush(chairID, this.curChairID, cardDataArr, this.allUserCardArr[chairID].length, this.curChairCanPass));

    // 判断是否结束
    if(this.curChairID < 0){
        this.gameEnd(chairID);
    }
};

// 过
pro.onUserPass = function (chairID) {
    if (this.gameStatus !== gameProto.gameStatus.OUT_CARD) {
        logger.error('onUserPass err: status err');
        return;
    }

    if (chairID !== this.curChairID) {
        logger.error('onUserPass err: chairID !== curChairID');
        return;
    }

    if (!this.curChairCanPass){
        logger.error('onUserPass err: cur user can not pass');
        return;
    }

    this.baoPeiChairID = -1;

    //设置变量
    this.curChairID = (this.curChairID+1)%3;
    if (this.curChairID === this.turnWinerChairID) {
        this.turnCardDataArr = [];
        this.curChairCanPass = false;
        // 如果用炸弹赢得该轮，则奖励炸弹分
        if (this.outBombChairID !== -1){
            this.bombTimesArr[this.outBombChairID]++;
            this.roomFrame.sendDataToAll(gameProto.gameUserBombWinPush(this.turnWinerChairID));
        }
    }else{
        // 判断当前用户是否可以pass
        let resultCardArr = gameLogic.searchOutCard(this.allUserCardArr[this.curChairID], this.turnCardDataArr);
        this.curChairCanPass = (!resultCardArr || resultCardArr.length === 0);
    }

    // 判断是否是机器人开始出牌
    let user = this.roomFrame.getUserByChairId(this.curChairID);
    if (user.userInfo.robot){
        this.robotOutCard(this.curChairID);
    }
    // 判断是否是离线玩家开始出牌
    else if ((user.userStatus & roomProto.userStatusEnum.OFFLINE) !== 0){
        this.offlineUserAutoOperation(this.curChairID);
    }

    // 推送用户放弃消息
    this.roomFrame.sendDataToAll(gameProto.gameUserPassPush(chairID, this.curChairID, this.curChairCanPass, this.turnCardDataArr.length === 0));
};

// --------------------- 离线操作 -----------------------------
pro.offlineUserAutoOperation = function (chairID) {
    if (this.curChairID !== chairID) return;
    setTimeout(function () {
        if (this.gameStatus !== gameProto.gameStatus.OUT_CARD) return;
        let user = this.roomFrame.getUserByChairId(chairID);
        if (!user || (user.userStatus & roomProto.userStatusEnum.OFFLINE) === 0) return;
        if (this.curChairID !== chairID) return;
        if (this.gameStatus === gameProto.gameStatus.OUT_CARD){
            if (this.turnCardDataArr.length === 0){
                this.receivePlayerMessage(chairID, gameProto.gameUserOutCardNotify([this.allUserCardArr[chairID][this.allUserCardArr[chairID].length - 1]]));
            }else{
                if (this.curChairCanPass){
                    this.receivePlayerMessage(chairID, gameProto.gameUserPassNotify());
                }else{
                    this.receivePlayerMessage(chairID, gameProto.gameUserOutCardNotify(gameLogic.searchOutCard(this.allUserCardArr[chairID], this.turnCardDataArr)));
                }
            }
        }
    }.bind(this), utils.getRandomNum(1, 3) * 1000);
};

// --------------------- 机器人操作 -----------------------------
// 机器人出牌
pro.robotOutCard = function (chairID) {
    if (this.gameStatus !== gameProto.gameStatus.OUT_CARD) {
        logger.error("robotOutCard err: game status err");
        return;
    }
    let delayTime = 0;
    if (this.curChairCanPass){
        delayTime = utils.getRandomNum(1000,2000);
    }else{
        // 第一个出牌玩家时间较长
        if (this.outCardDataArr.length === 0){
            delayTime = utils.getRandomNum(5000,8000);
        }else{
            delayTime = utils.getRandomNum(2000, 5000);
        }
    }
    setTimeout(function () {
        if (this.gameStatus !== gameProto.gameStatus.OUT_CARD) {
            logger.error("robotSnatchLandLord err: game status err");
            return;
        }
        if (this.curChairID !== chairID){
            logger.error("robotSnatchLandLord err: chairID err");
            return;
        }
        if (this.curChairCanPass){
            this.receivePlayerMessage(chairID, gameProto.gameUserPassNotify());
        }else{
            let nextUserChairID = (this.curChairID + 1)%3;
            let cardDataArr = this.allUserCardArr[chairID];
            let outCardResult = aiLogic.searchOutCard(cardDataArr, this.turnCardDataArr, this.allUserCardArr[nextUserChairID]);
            // 如果下家报单，出单牌时只能出最大单牌
            if (this.allUserCardArr[nextUserChairID].length === 1 && outCardResult.resultCard.length === 1){
                let maxCardData = cardDataArr[0];
                for (let i = 1; i < cardDataArr.length; ++i){
                    if (gameLogic.getCardLogicValue(maxCardData) < gameLogic.getCardLogicValue(cardDataArr[i])){
                        maxCardData = cardDataArr[i];
                    }
                }
                outCardResult.resultCard = [maxCardData];
            }
            this.receivePlayerMessage(chairID, gameProto.gameUserOutCardNotify(outCardResult.resultCard));
        }
    }.bind(this), delayTime);
};

/**************************************************************************************
 * room interface
 */
/* 玩家进入游戏时数据 */
pro.getEnterGameData = function(chairID) {
    let gameData = {
        gameStatus: this.gameStatus,
        baseScore: this.roomFrame.gameTypeInfo.baseScore,
        gameTypeInfo: this.roomFrame.gameTypeInfo,
        profitPercentage: this.roomFrame.gameTypeInfo.level ===0?0:parseInt(this.roomFrame.publicParameter["profitPercentage"] || 5)
    };
    if (this.gameStatus === gameProto.gameStatus.NONE){
        return gameData;
    }else{
        gameData.curChairID = this.curChairID;
        gameData.turnWinerChairID = this.turnWinerChairID;
        gameData.turnCardDataArr = this.turnCardDataArr;
        gameData.selfCardArr = this.allUserCardArr[chairID];
        gameData.allUserCardCountArr = [this.allUserCardArr[0].length, this.allUserCardArr[1].length, this.allUserCardArr[2].length];
        if (this.gameStatus === gameProto.gameStatus.OUT_CARD){
            gameData.outCardDataArr = this.outCardDataArr;
            gameData.enbalePass = this.curChairCanPass;
            gameData.userBombTimes = this.bombTimesArr;
        }
        return gameData;
    }
};

pro.onEventGamePrepare = function(cb) {
	if(!!cb) cb();
};

pro.onEventGameStart = function(cb) {
	this.startGame();
	if(!! cb) cb();
};

pro.onEventUserEntry = function(entryUserChairId, cb) {
	if(!! cb) cb();
};

pro.onEventUserLeave = function(leaveUserChairId, cb) {
	if(!! cb) cb();
};

pro.isUserEnableLeave = function() {
    return (this.gameStatus === gameProto.gameStatus.NONE);
};

pro.onEventUserOffLine = function(offLineUserChairId, cb) {
    if (this.curChairID === offLineUserChairId){
        this.offlineUserAutoOperation(offLineUserChairId);
    }
	if(!! cb) cb();
};

pro.onEventRoomDismiss = function() {
};