let utils = require('../../util/utils');
let gameLogic = require('./gameLogic');
let gameProto = require('./DDZProto');
let roomProto = require('../../API/Protos/RoomProto');
let scheduler = require('pomelo-scheduler');
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

	if(type === gameProto.GAME_SNATCH_LANDLORD_NOTIFY) {
        this.onUserSnatchLandlord(chairID, data);
	}else if(type === gameProto.GAME_USER_OUT_CARD_NOTIFY){
	    this.onUserOutCard(chairID, data);
    }else if (type === gameProto.GAME_USER_PASS_NOTIFY){
	    this.onUserPass(chairID);
    }
};

pro.resetGame = function () {
    this.gameStatus	 = gameProto.gameStatus.NONE;
    this.landScore = 0;
    this.bombTimes = 1;
    this.bankerUserChairID = -1;
    this.curChairID = -1;
    this.firstChairID = -1;

    // 出牌信息
    this.turnWinerChairID = -1;
    this.turnCardDataArr = [];

    this.allUserCardArr = [];
    this.backCardArr = [];
    this.outCardTimesArr = [0, 0 ,0];
    this.outCardDataArr = [];

    this.snatchScoreArr = [-1, -1 , -1];
};

// 开始游戏
pro.startGame = function() {
    this.gameStatus = gameProto.gameStatus.SNATCH_LANDLORD;

    this.curChairID = utils.getRandomNum(0, 2);
    this.firstChairID = this.curChairID;

    // 洗牌
    let allCardData = gameLogic.getRandCardList();
    // 设置底牌
    this.backCardArr = gameLogic.sortCardList(allCardData.slice(51, 54));
    // 发牌
    for (let i = 0; i< 3; ++i){
        let cardArr = gameLogic.sortCardList(allCardData.slice(i * 17, i * 17 + 17));
        this.allUserCardArr.push(cardArr);
    }
    // 调整牌
    let rate = this.roomFrame.getCurRobotWinRate();
    if (Math.random() < rate){
        let robotArr = [false, false, false];
        for (let j = 0; j < 3; ++j){
            let user1 = this.roomFrame.getUserByChairId(j)
            if (!!user1 && user1.userInfo.robot){
                robotArr[j] = true;
            }
        }
        aiLogic.reSortCard(this.allUserCardArr, robotArr);
    }
    // 发牌推送
    for (let i = 0; i < 3; ++i){
        this.roomFrame.sendData(gameProto.gameSendCardPush(this.curChairID, this.allUserCardArr[i]), [i]);
    }
    // 判断是否是机器人开始叫分
    let user = this.roomFrame.getUserByChairId(this.curChairID);
    if (user.userInfo.robot){
        this.robotSnatchLandLord(this.curChairID, true);
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
    let isLandWin = this.allUserCardArr[this.bankerUserChairID].length === 0;

    //春天判断
    let isSpring = false;
    if (winChairID === this.bankerUserChairID) {
        let user1 = (this.bankerUserChairID + 1) % 3;
        let user2 = (this.bankerUserChairID + 2) % 3;
        if ((this.outCardTimesArr[user1] === 0) && (this.outCardTimesArr[user2] === 0)){
            isSpring = true;
        }
    } else {
        if (this.outCardTimesArr[this.bankerUserChairID] === 1){
            isSpring = true;
        }
    }

    if (isSpring){
        this.bombTimes *= 2;
    }

    //游戏积分
    let scoreChangeArr = [];
    let endData = [];
    //统计积分
    for (let i = 0; i < 3; i++ ){
        let score = 0;
        //统计积分
        if (i === this.bankerUserChairID) {
            score = this.bombTimes * this.landScore * baseScore * (isLandWin?2:-2);
            scoreChangeArr.push(score);
            endData.push({
                uid: this.roomFrame.getUserByChairId(i).userInfo.uid,
                score: score
            });
        } else {
            score = this.bombTimes * this.landScore * baseScore * (isLandWin?-1:1);
            scoreChangeArr.push(score);
            endData.push({
                uid: this.roomFrame.getUserByChairId(i).userInfo.uid,
                score: score
            });
        }
    }
    //切换用户
    this.firstChairID = winChairID;

    let nicknameArr = [];
    for (let i = 0; i < 3; ++i){
        let user = this.roomFrame.getUserByChairId(i);
        nicknameArr.push(!!user?user.userInfo.nickname:"");
    }
    this.roomFrame.sendDataToAll(gameProto.gameResultPush(this.allUserCardArr, scoreChangeArr, this.bombTimes * this.landScore, nicknameArr, isSpring, isLandWin));

    this.resetGame();

    this.roomFrame.concludeGame(endData);
};

// 叫分
pro.onUserSnatchLandlord = function (chairID, data) {
    if (this.gameStatus !== gameProto.gameStatus.SNATCH_LANDLORD) {
        logger.error('userSnatchLandlord err: status err');
        return;
    }

    if (chairID !== this.curChairID) {
        logger.error('userSnatchLandlord err: chairID !== curChairID');
        return;
    }

    if (typeof data.score !== 'number' || data.score > 3 || (data.score !== 0 && data.score <= this.landScore)){
        logger.error('userSnatchLandlord err: score=' + data.score);
        return;
    }

    if (this.snatchScoreArr[chairID] !== -1){
        logger.error('userSnatchLandlord err: user already snatch landlord');
        return;
    }

    // 叫地主
    if (data.score > 0 ){
        this.landScore = data.score;
        this.bankerUserChairID = chairID;
    }
    let nextChairID = (chairID + 1)%3;
    if (this.landScore === 3 || nextChairID === this.firstChairID) nextChairID = -1;
    // 发送叫地主推送
    this.roomFrame.sendDataToAll(gameProto.gameUserSnatchLandlordPush(data.score, nextChairID, chairID, this.landScore));

    // 开始判断
    if (nextChairID === -1){
        // 无人叫分，重新发牌
        if (this.landScore === 0){
            this.resetGame();
            this.startGame();
        }
        // 游戏开始
        else{
            this.gameStatus = gameProto.gameStatus.OUT_CARD;
            this.curChairID = this.bankerUserChairID;
            this.turnCardDataArr = [];
            this.turnWinerChairID = this.bankerUserChairID;
            this.allUserCardArr[this.bankerUserChairID] = gameLogic.sortCardList(this.allUserCardArr[this.bankerUserChairID].concat(this.backCardArr));
            this.roomFrame.sendDataToAll(gameProto.gameStartPush(this.bankerUserChairID, this.landScore, this.backCardArr));

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
    }else{
        this.curChairID = nextChairID;

        // 判断是否是机器人开始叫分
        let user = this.roomFrame.getUserByChairId(this.curChairID);
        if (user.userInfo.robot){
            this.robotSnatchLandLord(this.curChairID, false);
        }
        // 判断是否是离线玩家开始出牌
        else if ((user.userStatus & roomProto.userStatusEnum.OFFLINE) !== 0){
            this.offlineUserAutoOperation(this.curChairID);
        }
    }
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
    let cardType = gameLogic.getCardType(data.outCardArr);
    if (cardType === gameProto.cardType.ERROR){
        logger.error('userSnatchLandlord err: card type error');
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
    if ((cardType === gameProto.cardType.BOMB_CARD)||(cardType === gameProto.cardType.MISSILE_CARD)) this.bombTimes *= 2;

    // 切换用户
    if (this.allUserCardArr[chairID].length === 0){
        this.curChairID = -1;
    }else{
        //if (cardType !== gameProto.cardType.MISSILE_CARD) this.curChairID = (this.curChairID + 1)%3;
        this.curChairID = (this.curChairID + 1)%3;

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

    // 出牌最大
    //if (cardType === gameProto.cardType.MISSILE_CARD) this.turnCardDataArr = [];

    // 玩家出牌推送
    this.roomFrame.sendDataToAll(gameProto.gameUserOutCardPush(chairID, this.curChairID, cardDataArr, this.allUserCardArr[chairID].length));

    // 判断是否结束
    if(this.curChairID < 0){
        this.gameEnd();
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

    //设置变量
    this.curChairID = (this.curChairID+1)%3;
    if (this.curChairID === this.turnWinerChairID) this.turnCardDataArr = [];

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
    this.roomFrame.sendDataToAll(gameProto.gameUserPassPush(chairID, this.curChairID, this.turnCardDataArr.length === 0));
};

// --------------------- 离线操作 -----------------------------
pro.offlineUserAutoOperation = function (chairID) {
    if (this.curChairID !== chairID){
        return;
    }
    setTimeout(function () {
        if (this.gameStatus !== gameProto.gameStatus.SNATCH_LANDLORD && this.gameStatus !== gameProto.gameStatus.OUT_CARD) return;
        let user = this.roomFrame.getUserByChairId(chairID);
        if (!user || (user.userStatus & roomProto.userStatusEnum.OFFLINE) === 0) return;
        if (this.curChairID !== chairID){
            return;
        }
        if (this.gameStatus === gameProto.gameStatus.SNATCH_LANDLORD){
            this.receivePlayerMessage(chairID, gameProto.gameUserSnatchLandlordNotify(0));
        }else if (this.gameStatus === gameProto.gameStatus.OUT_CARD){
            if (this.turnCardDataArr.length === 0){
                this.receivePlayerMessage(chairID, gameProto.gameUserOutCardNotify([this.allUserCardArr[chairID][this.allUserCardArr[chairID].length - 1]]));
            }else{
                this.receivePlayerMessage(chairID, gameProto.gameUserPassNotify());
            }
        }
    }.bind(this), utils.getRandomNum(1, 3) * 1000);
};

// --------------------- 机器人操作 -----------------------------
// 机器人叫分
pro.robotSnatchLandLord = function (chairID, isFirst) {
    if (this.gameStatus !== gameProto.gameStatus.SNATCH_LANDLORD) {
        logger.error("robotSnatchLandLord err: game status err");
        return;
    }
    setTimeout(function () {
        if (this.gameStatus !== gameProto.gameStatus.SNATCH_LANDLORD) {
            logger.error("robotSnatchLandLord err: game status err");
            return;
        }
        if (this.curChairID !== chairID){
            logger.error("robotSnatchLandLord err: chairID err");
            return;
        }
        let score = aiLogic.landScore(chairID, this.landScore, this.allUserCardArr);
        this.receivePlayerMessage(chairID, gameProto.gameUserSnatchLandlordNotify(score));
    }.bind(this), 1000 * (utils.getRandomNum(3,5) + !!isFirst?5:0));
};

// 机器人出牌
pro.robotOutCard = function (chairID) {
    if (this.gameStatus !== gameProto.gameStatus.OUT_CARD) {
        logger.error("robotSnatchLandLord err: game status err");
        return;
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
        let outCardResult;
        try {
            outCardResult = aiLogic.searchOutCard(this.allUserCardArr[chairID], this.turnCardDataArr, this.turnWinerChairID, chairID, this.bankerUserChairID, this.allUserCardArr);
        }catch (err){
            logger.error(err);
            outCardResult = {
                cardCount: 0,
                resultCard: []
            }
        }

        // 不出
        if (outCardResult.cardCount === 0){
            // 先出牌不能为空
            if(this.turnCardDataArr.length === 0){
                // 出最小的一张牌
                logger.error("robotOutCard err: 先出牌为空");
                outCardResult = {
                    cardCount: 1,
                    resultCard: [this.allUserCardArr[chairID][this.allUserCardArr[chairID].length - 1]]
                }
            }
        } else{
            // 检验牌是否合理
            let outCardType = gameLogic.getCardType(outCardResult.resultCard);
            if (this.turnCardDataArr.length === 0){
                if (outCardType === gameProto.cardType.ERROR){
                    logger.error("robotOutCard err: 出牌错误");
                    logger.error(this.allUserCardArr[chairID]);
                    // 出最小牌
                    outCardResult = {
                        cardCount: 1,
                        resultCard: [this.allUserCardArr[chairID][this.allUserCardArr[chairID].length - 1]]
                    }
                }
            }else{
                if (outCardType === gameProto.cardType.ERROR){
                    logger.error("robotOutCard err: 出牌牌型错误");
                    logger.error(this.allUserCardArr[chairID]);
                    // 不出
                    outCardResult = {
                        cardCount: 0,
                        resultCard: []
                    }
                }else{
                    if (!gameLogic.compareCard(this.turnCardDataArr, outCardResult.resultCard)){
                        // 不出
                        outCardResult = {
                            cardCount: 0,
                            resultCard: []
                        }
                    }
                }
            }
        }

        if(outCardResult.cardCount === 0){
            this.receivePlayerMessage(chairID, gameProto.gameUserPassNotify());
        }else{
            this.receivePlayerMessage(chairID, gameProto.gameUserOutCardNotify(outCardResult.resultCard));
        }
    }.bind(this), 1000 * utils.getRandomNum(1,3));
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
        gameData.landScore = this.landScore;
        gameData.bombTimes = this.bombTimes;
        gameData.bankerUserChairID = this.bankerUserChairID;
        gameData.curChairID = this.curChairID;
        gameData.firstChairID = this.firstChairID;
        gameData.turnWinerChairID = this.turnWinerChairID;
        gameData.turnCardDataArr = this.turnCardDataArr;
        gameData.selfCardArr = this.allUserCardArr[chairID];
        gameData.allUserCardCountArr = [this.allUserCardArr[0].length, this.allUserCardArr[1].length, this.allUserCardArr[2].length];
        gameData.snatchScoreArr = this.snatchScoreArr;
        if (this.gameStatus === gameProto.gameStatus.OUT_CARD){
            gameData.backCardArr = this.backCardArr;
            gameData.outCardDataArr = this.outCardDataArr;
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