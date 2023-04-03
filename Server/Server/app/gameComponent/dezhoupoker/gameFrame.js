let utils = require('../../util/utils');
let gameLogic = require('./DZGameLogic');
let gameProto = require('./DZProto');
let roomProto = require('../../API/Protos/RoomProto');
let aiLogic = require('./aiLogic');
let logger = require('pomelo-logger').getLogger('game');


module.exports = function(roomFrame) {
	return new gameFrameSink(roomFrame);
};

let gameFrameSink = function(roomFrame) {
	this.roomFrame = roomFrame;

    this.gameStatus	 = gameProto.gameStatus.NONE;
    this.bankerUserChairID = -1;                        // 庄家ID
};

let pro = gameFrameSink.prototype;

pro.receivePlayerMessage = function (chairID, msg){
	let type = msg.type || null;
	let data = msg.data || null;
	if (!type || !data) return;

	if(type === gameProto.GAME_USER_BET_NOTIFY) {
        this.onUserBet(chairID, data);
	}else if(type === gameProto.GAME_USER_GIVE_UP_NOTIFY){
        this.onUserGiveUp(chairID);
    }
};

pro.resetGame = function () {
    this.gameStatus	 = gameProto.gameStatus.NONE;       // 游戏状态

    this.currentUserChairID = -1;                      // 当前行动用户

    this.userStatusArr = [];                           // 用户状态

    this.publicCardArr = [];                            // 公共牌
    this.showPublicCardArr = [];                        // 已显示的公共牌

    this.allUserCardArr = [];                           // 所有用户的牌

    this.curTurnBetCountArr = [];                       // 当前轮下注金额
    this.curTurnOperationStatus = [];                   // 当前轮玩家操作状态
    this.curTurnMaxBetCount = 0;                        // 当前轮的最大下注
    this.totalBetCountArr = [];                         // 总下注金额

    this.allInUserStatus = [];                          // 玩家全押的状态

    // 机器人相关
    this.curMaxCardChairID = -1;
    this.maxCardTypeArr = [];
    // 初始化属性
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        this.userStatusArr.push(gameProto.userStatus.NONE);
        this.allUserCardArr.push([]);
        this.curTurnBetCountArr.push(0);
        this.totalBetCountArr.push(0);
        this.allInUserStatus.push(false);
        this.curTurnOperationStatus.push(false);
    }
};
// 开始游戏
pro.startGame = function() {
    // 初始化数据
    this.resetGame();
    // 修改游戏状态
    this.gameStatus	 = gameProto.gameStatus.PLAYING;
    // 修改玩家状态
    let playingChairIDArr = [];
    let parameter = JSON.parse(this.roomFrame.gameTypeInfo["parameters"] || "{}");
    let maxTake = parameter["maxTake"];
    let minTake = this.roomFrame.gameTypeInfo.goldLowerLimit;
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        let user = this.roomFrame.getUserByChairId(i);
        this.userStatusArr[i] = !!user?gameProto.userStatus.PLAYING:gameProto.userStatus.NONE;
        if (!!user){
            playingChairIDArr.push(i);
            // 金币不足最低带入金币的玩家，自动补齐
            if (user.userInfo.takeGold < minTake){
                if (user.userInfo.gold > maxTake){
                    user.userInfo.takeGold = maxTake;
                }else{
                    user.userInfo.takeGold = user.userInfo.gold;
                }
                this.roomFrame.sendDataToAll(gameProto.gameUserUpdateTakeGoldPush(i, user.userInfo.takeGold));
            }
        }
    }
    // 确定庄家
    if (this.bankerUserChairID === -1){
        // 第一局随机庄家
        this.bankerUserChairID = playingChairIDArr[utils.getRandomNum(0, playingChairIDArr.length - 1)];
    }else{
        // 上局的庄家的左手边用户为新的庄家
        for (let i = 1; i < this.roomFrame.chairCount; ++i){
            let chairID = (this.bankerUserChairID + i)%this.roomFrame.chairCount;
            if (playingChairIDArr.indexOf(chairID) !== -1){
                this.bankerUserChairID = chairID;
                break;
            }
        }
    }
    // 洗牌
    let allCardData = gameLogic.getRandCardList();
    // 设置公共牌
    this.publicCardArr = allCardData.splice(0, 5);
    // 发牌
    for (let i = 0; i < playingChairIDArr.length; ++i){
        this.allUserCardArr[playingChairIDArr[i]] = allCardData.splice(0, 2);
    }
    // 是否做牌型控制
    if (Math.random() < this.roomFrame.getCurRobotWinRate()){
        let robotChairIDArr = [];
        for (let i = 0; i < playingChairIDArr.length; ++i){
            let user = this.roomFrame.getUserByChairId(playingChairIDArr[i]);
            if (!user) continue;
            if (user.userInfo.robot) robotChairIDArr.push(i);
        }
        if (robotChairIDArr.length > 0){
            // 调整牌，让机器人拿最大牌
            let maxCardDataArr = null;
            this.curMaxCardChairID = -1;
            for (let i = 0; i < this.allUserCardArr.length; ++i){
                if (this.allUserCardArr[i].length > 0){
                    let cardArr = gameLogic.fiveFromSeven(this.allUserCardArr[i], this.publicCardArr);
                    if (!maxCardDataArr || gameLogic.compareCard(cardArr, maxCardDataArr) === 2){
                        maxCardDataArr = cardArr;
                        this.curMaxCardChairID = i;
                    }
                }
            }
            // 将最大牌型给机器人
            if (robotChairIDArr.indexOf(this.curMaxCardChairID) === -1){
                let robotChairID = robotChairIDArr[utils.getRandomNum(0, robotChairIDArr.length - 1)];
                let tempArr = this.allUserCardArr[robotChairID];
                this.allUserCardArr[robotChairID] = this.allUserCardArr[this.curMaxCardChairID];
                this.allUserCardArr[this.curMaxCardChairID] = tempArr;
            }
        }
    }
    // 记录最大的牌类型
    for (let i = 0; i < this.allUserCardArr.length; ++i){
        if (this.allUserCardArr[i].length === 0){
            this.maxCardTypeArr.push(0);
        }else{
            this.maxCardTypeArr.push(gameLogic.getCardType(gameLogic.fiveFromSeven(this.allUserCardArr[i], this.publicCardArr)));
        }
    }
    // 设置下盲注
    let blindBetArr = [];
    let tempChairID = this.bankerUserChairID;
    do{
        let chairID = ++tempChairID%this.roomFrame.chairCount;
        if (playingChairIDArr.indexOf(chairID) !== -1) blindBetArr.push(chairID);
    }while (blindBetArr.length < 3);
    let bindBetCount = parameter["blindBetCount"];
    this.updateUserBet(blindBetArr[0], bindBetCount);         // 小盲
    this.updateUserBet(blindBetArr[1], bindBetCount * 2);     // 大盲
    // 设置当前行动用户
    this.currentUserChairID = blindBetArr[2];
    // 设置下前注
    let preBetCount = parameter["preBetCount"];
    if (preBetCount > 0){
        for (let i = 0; i < playingChairIDArr.length; ++i){
            this.updateUserBet(playingChairIDArr[i], preBetCount);
        }
    }
    // 发送游戏开始消息
    for (let i = 0; i < playingChairIDArr.length; ++i){
        this.roomFrame.sendData(gameProto.gameStartPush(this.bankerUserChairID, this.allUserCardArr[playingChairIDArr[i]], this.currentUserChairID, this.curTurnMaxBetCount, this.curTurnBetCountArr, this.userStatusArr, this.roomFrame.drawID), [playingChairIDArr[i]]);
    }
    // 离线用户和机器人操作
    this.checkAutoOperation();
};

// 游戏结束
pro.gameEnd = function () {
    // 修改操作用户ID
    this.currentUserChairID = -1;
    // 获取可能赢的玩家的ID
    let leftChairArr = [];
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        if ((this.userStatusArr[i] === gameProto.userStatus.PLAYING)){
            leftChairArr.push(i);
        }
    }
    let winType = (leftChairArr.length === 1)?gameProto.winType.ONLY_ONE:gameProto.winType.MAX_CARD;
    let winChairIDArr = [];
    if (winType === gameProto.winType.ONLY_ONE){
        winChairIDArr = leftChairArr;
    }
    // 计算总下注
    let totalBetCount = 0;
    for (let i = 0; i < this.totalBetCountArr.length; ++i){
        totalBetCount += this.totalBetCountArr[i];
    }
    // 复制总下注金额
    let tempTotalBetCountArr = this.totalBetCountArr.slice();
    // 初始化玩家赢分
    let winCountArr = [];
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        if (this.userStatusArr[i] === gameProto.userStatus.NONE){
            winCountArr.push(0);
        }else{
            winCountArr.push(-this.totalBetCountArr[i]);
        }
    }
    let self = this;
    function calculate(chairIDArr) {
        // 没有赢的玩家，退回剩余下注金额
        if (chairIDArr.length === 0){
            for (let i = 0; i < tempTotalBetCountArr.length; ++i){
                winCountArr[i] += tempTotalBetCountArr[i];
            }
        }else if (chairIDArr.length === 1){
            let winChairID = chairIDArr[0];
            let betCount = tempTotalBetCountArr[winChairID];
            for (let i = 0; i < tempTotalBetCountArr.length; ++i){
                if (tempTotalBetCountArr[i] <= betCount){
                    winCountArr[winChairID] += tempTotalBetCountArr[i];
                    tempTotalBetCountArr[i] = 0;
                }else{
                    winCountArr[winChairID] += betCount;
                    tempTotalBetCountArr[i] -= betCount;
                }
            }
            calculate([]);
        }else{
            // 获取所有用户的最大牌型
            let allUserCardArr = [];
            for (let i = 0; i < self.allUserCardArr.length; ++i){
                if (chairIDArr.indexOf(i) !== -1){
                    let maxCardDataArr = gameLogic.fiveFromSeven(self.allUserCardArr[i], self.publicCardArr);
                    allUserCardArr.push(maxCardDataArr);
                }else{
                    allUserCardArr.push(null);
                }
            }
            // 计算赢牌玩家列表
            let winList = gameLogic.selectMaxUser(allUserCardArr);
            if (winChairIDArr.length === 0){
                winChairIDArr = winList.slice();
            }
            // 获取该次比拼中最小的下注金额
            let minBetCount = tempTotalBetCountArr[0];
            for (let i = 1; i < tempTotalBetCountArr.length; ++i){
                if (chairIDArr.indexOf(i) === -1) continue;
                if (tempTotalBetCountArr[i] < minBetCount){
                    minBetCount = tempTotalBetCountArr[i];
                }
            }
            // 计算赢金币总额
            let chairArr = [];
            let winCount = 0;
            for (let i = 0; i < tempTotalBetCountArr.length; ++i){
                if (chairIDArr.indexOf(i) === -1) continue;
                winCount += minBetCount;
                tempTotalBetCountArr[i] -= minBetCount;
                // 如果还有剩余金币，则可继续下一轮比牌
                if (tempTotalBetCountArr[i] > 0){
                    chairArr.push(i);
                }
            }
            // 赢的人平分金币
            for (let i = 0; i < winCountArr.length; ++i){
                if (winList.indexOf(i) === -1) continue;
                winCountArr[i] += (winCount/winList.length)
            }
            // 剩余下注金额大于0的用户，继续下一轮比牌
            calculate(chairArr);
        }
    }
    calculate(leftChairArr);
    let scoreChangeArr = [];
    let profitPercentage = parseInt(this.roomFrame.publicParameter["profitPercentage"] || 5);
    for(let i = 0; i < winCountArr.length; ++i){
        if (winCountArr[i] === 0) continue;
        let user = this.roomFrame.getUserByChairId(i);
        if (!user) continue;
        scoreChangeArr.push({
            uid: user.userInfo.uid,
            score: winCountArr[i]
        });
        // 更新takeGold
        if (winCountArr[i] > 0){
            user.userInfo.takeGold += (winCountArr[i] * (1 - profitPercentage/100));
        }else{
            user.userInfo.takeGold += winCountArr[i];
        }
    }
    // 延迟发送结果，并结算
    this.gameStatus = gameProto.gameStatus.NONE;
    this.roomFrame.sendDataToAll(gameProto.gameResultPush(this.allUserCardArr, winCountArr, winChairIDArr, winType, this.showPublicCardArr, totalBetCount));
    this.roomFrame.concludeGame(scoreChangeArr);
};

// 用户下注
pro.onUserBet = function (chairID, data) {
    let user = this.roomFrame.getUserByChairId(chairID);
    // 检验用户是否合理
    if (this.currentUserChairID !== chairID || !user){
        logger.error("onUserBet", "not cur user");
        return;
    }
    // 检查下注金额是否有效
    if ((typeof data.count !== 'number') || (data.count < 0 && data.count !== -1)){
        logger.error("onUserBet", "bet count err:" + data.count);
        return;
    }
    // 判断金币是否足够
    if (data.count > 0 && (user.userInfo.takeGold < (this.totalBetCountArr[chairID] + data.count))){
        logger.error("onUserBet", "not enough gold");
        return;
    }
    let operationType = gameProto.operationType.NONE;
    // 过牌
    if (data.count === 0){
        if (this.curTurnBetCountArr[chairID] !== this.curTurnMaxBetCount){
            logger.error("onUserBet", "can not pass");
            return;
        }
        operationType = gameProto.operationType.PASS;
    }
    // all in
    else if (data.count === -1){
        // 下注剩余所有金币
        let leftGold = user.userInfo.takeGold - this.totalBetCountArr[chairID];
        this.updateUserBet(chairID, leftGold);
        // 记录all in状态
        this.allInUserStatus[chairID] = true;

        operationType = gameProto.operationType.ALL_IN;
    }
    // 跟注或者加注
    else{
        // 下注总额不得小于当前最大下注额
        if (this.totalBetCountArr[chairID] + data.count < this.curTurnMaxBetCount){
            logger.error("onUserBet", "total bet count can not lower to curTurnMaxBetCount");
            return;
        }
        // 计算操作类型
        if (this.curTurnMaxBetCount < this.totalBetCountArr[chairID] + data.count){
            operationType = gameProto.operationType.ADD_BET;
        }else{
            operationType = gameProto.operationType.FLOW;
        }

        // 更新下注金额
        this.updateUserBet(chairID, data.count);
    }
    // 修改状态
    this.curTurnOperationStatus[chairID] = true;
    // 该轮完成
    if (this.isCurTurnFinished()){
        // 发送玩家下注通知
        this.roomFrame.sendDataToAll(gameProto.gameUserBetPush(chairID, data.count, this.curTurnBetCountArr[chairID], -1, 0, 0, operationType));
        // 开始下一路
        this.startNextTurn();
    }else{
        // 计算下一个操作玩家
        for (let i = 1; i < this.roomFrame.chairCount; ++i){
            let tempChairID = (this.currentUserChairID + i)%this.userStatusArr.length;
            if ((this.userStatusArr[tempChairID] !== gameProto.userStatus.PLAYING) || (this.allInUserStatus[tempChairID])) continue;
            this.currentUserChairID = tempChairID;
            break;
        }
        // 发送玩家下注通知
        this.roomFrame.sendDataToAll(gameProto.gameUserBetPush(chairID, data.count, this.curTurnBetCountArr[chairID], this.currentUserChairID, this.curTurnBetCountArr[this.currentUserChairID], this.curTurnMaxBetCount, operationType));
        // 检查自动操作
        this.checkAutoOperation();
    }
};

pro.onUserGiveUp = function (chairID) {
    let user = this.roomFrame.getUserByChairId(chairID);
    // 检验用户是否合理
    if (this.currentUserChairID !== chairID || !user){
        logger.error("onUserBet", "not cur user");
        return;
    }
    // 修改玩家状态
    this.userStatusArr[chairID] = gameProto.userStatus.GIVE_UP;
    if (this.isCurTurnFinished()){
        // 发送玩家玩家放弃消息
        this.roomFrame.sendDataToAll(gameProto.gameUserGiveUpPush(chairID, -1, 0, 0));
        // 开始下一轮
        this.startNextTurn();
    }else{
        // 计算下一个操作玩家
        for (let i = 1; i < this.roomFrame.chairCount; ++i){
            let chairID = (this.currentUserChairID + i)%this.userStatusArr.length;
            if ((this.userStatusArr[chairID] !== gameProto.userStatus.PLAYING) || (this.allInUserStatus[chairID])) continue;
            this.currentUserChairID = chairID;
            break;
        }
        // 发送玩家下注通知
        this.roomFrame.sendDataToAll(gameProto.gameUserGiveUpPush(chairID, this.currentUserChairID, this.curTurnBetCountArr[this.currentUserChairID], this.curTurnMaxBetCount));
        // 检查自动操作
        this.checkAutoOperation();
    }
};

pro.isCurTurnFinished = function () {
    // 判断是否只有一个玩家
    let playingUserCount = 0;
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        if ((this.userStatusArr[i] === gameProto.userStatus.PLAYING)){
            playingUserCount++;
        }
    }
    // 只有一个正在玩的玩家
    if (playingUserCount <= 1) return true;

    let isFinishedTurn = false;
    for (let i = 0; i < this.roomFrame.chairCount; ++i){
        if ((this.userStatusArr[i] === gameProto.userStatus.PLAYING) && !this.allInUserStatus[i] && (this.curTurnBetCountArr[i] < this.curTurnMaxBetCount || !this.curTurnOperationStatus[i])) break;
        if (i === this.userStatusArr.length - 1) {
            isFinishedTurn = true;
        }
    }
    return isFinishedTurn;
};

pro.startNextTurn = function () {
    // 所有牌已发完，游戏结束
    if (this.showPublicCardArr.length === 5){
        this.gameEnd();
    }else{
        // 判断是否只剩下一个可操作用户，如果只存在一个可操作用户，发所有牌并结算
        let enableOperateUserCount = 0;
        let playingUserCount = 0;
        for (let i = 0; i < this.roomFrame.chairCount; ++i){
            if ((this.userStatusArr[i] === gameProto.userStatus.PLAYING)){
                playingUserCount++;
                if (!this.allInUserStatus[i]){
                    enableOperateUserCount++;
                }
            }
        }
        // 只有一个正在玩的玩家
        if (playingUserCount <= 1){
            this.gameEnd();
        }
        // 只有一个可操作玩家，发完所有牌，结束游戏
        else if (enableOperateUserCount <= 1){
            this.showPublicCardArr = this.publicCardArr;
            this.gameEnd();
        }else{
            // 发牌开始下一轮
            if (this.showPublicCardArr.length === 0){
                this.showPublicCardArr = this.publicCardArr.slice(0, 3);
            }else{
                this.showPublicCardArr.push(this.publicCardArr[this.showPublicCardArr.length]);
            }
            // 将当前轮下注放入奖池中
            let totalBetCount = 0;
            for (let i = 0; i < this.curTurnBetCountArr.length; ++i){
                if (this.userStatusArr[i] === gameProto.userStatus.NONE) continue;
                // 计算总奖池金额
                totalBetCount += this.totalBetCountArr[i];
            }
            // 清理当前轮数据
            this.curTurnMaxBetCount = 0;
            this.curTurnBetCountArr = [];
            this.curTurnOperationStatus = [];
            for (let i = 0; i < this.roomFrame.chairCount; ++i){
                this.curTurnBetCountArr.push(0);
                this.curTurnOperationStatus.push(false);
            }
            // 计算下一个操作的玩家
            for (let i = 1; i < this.roomFrame.chairCount; ++i){
                let chairID = (this.currentUserChairID + i)%this.userStatusArr.length;
                if ((this.userStatusArr[chairID] !== gameProto.userStatus.PLAYING) || (this.allInUserStatus[chairID])) continue;
                this.currentUserChairID = chairID;
                break;
            }
            // 发送发牌推送
            this.roomFrame.sendDataToAll(gameProto.gameSendPublicCardPush(this.showPublicCardArr, this.currentUserChairID, 0, this.curTurnMaxBetCount, totalBetCount));
            // 检查自动操作
            this.checkAutoOperation();
        }
    }
};

pro.updateUserBet = function (chairID, betCount) {
    this.curTurnBetCountArr[chairID] += betCount;
    this.totalBetCountArr[chairID] += betCount;

    if (this.curTurnBetCountArr[chairID] > this.curTurnMaxBetCount){
        this.curTurnMaxBetCount = this.curTurnBetCountArr[chairID];
    }
};

// 检查当前用户是否需要自动操作
pro.checkAutoOperation = function () {
    // 判定是否参与当局游戏
    if (this.userStatusArr[this.currentUserChairID] !== gameProto.userStatus.PLAYING) return;
    let user = this.roomFrame.getUserByChairId(this.currentUserChairID);
    // 机器人则执行AI操作
    if (user.userInfo.robot){
        this.robotAutoOperation(this.currentUserChairID);
    }
    // 玩家离线则执行自动操作
    else{
        if ((user.userStatus&roomProto.userStatusEnum.OFFLINE) === 0) return;
        this.offlineUserAutoOperation(this.currentUserChairID);
    }
};

// --------------------- 离线操作 -----------------------------
pro.offlineUserAutoOperation = function (chairID) {
    if (this.userStatusArr[chairID] !== gameProto.userStatus.PLAYING) return;
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
    setTimeout(function(){
        if (this.userStatusArr[chairID] !== gameProto.userStatus.PLAYING) return;
        if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
        if (this.currentUserChairID !== chairID) return;
        let user = this.roomFrame.getUserByChairId(chairID);
        if (!user || (user.userStatus & roomProto.userStatusEnum.OFFLINE) === 0 ) return;
        // 过或者弃牌
        if(this.curTurnBetCountArr[chairID] < this.curTurnMaxBetCount){
            this.receivePlayerMessage(chairID, gameProto.gameUserGiveUpNotify());
        }else{
            this.receivePlayerMessage(chairID, gameProto.gameUserBetNotify(0));
        }
    }.bind(this), 2000);
};

// --------------------- 机器人操作 -----------------------------
pro.robotAutoOperation = function (chairID) {
    let user = this.roomFrame.getUserByChairId(chairID);
    if (!user || !user.userInfo.robot) return;
    if (this.currentUserChairID !== chairID) return;
    if (this.userStatusArr[chairID] !== gameProto.userStatus.PLAYING) return;
    if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;
    setTimeout(function(){
        if (this.currentUserChairID !== chairID) return;
        if (this.userStatusArr[chairID] !== gameProto.userStatus.PLAYING) return;
        if (this.gameStatus !== gameProto.gameStatus.PLAYING) return;

        let parameter = JSON.parse(this.roomFrame.gameTypeInfo["parameters"] || "{}");
        let blindBetCount = parameter["blindBetCount"];
        let preBetCount = parameter['preBetCount'] || 0;
        let maxCardType = this.maxCardTypeArr[chairID];
        let leftCount = user.userInfo.takeGold - this.totalBetCountArr[chairID];
        let res = aiLogic.getOperationResult(maxCardType, this.curTurnBetCountArr[chairID], this.curTurnMaxBetCount, this.totalBetCountArr[chairID] - preBetCount, leftCount, blindBetCount * 2, this.curMaxCardChairID === chairID);
        this.receivePlayerMessage(chairID, res);
    }.bind(this), utils.getRandomNum(2000, 4000));
};

/**************************************************************************************
 * room interface
 */
/* 玩家进入游戏时数据 */
pro.getEnterGameData = function(chairID) {
    let gameData = {
        gameStatus: this.gameStatus,
        gameTypeInfo: this.roomFrame.gameTypeInfo,
        profitPercentage: parseInt(this.roomFrame.publicParameter["profitPercentage"] || 5)
    };
    if (this.gameStatus === gameProto.gameStatus.NONE){
        return gameData;
    } else if (this.gameStatus === gameProto.gameStatus.PLAYING){
        gameData.currentUserChairID = this.currentUserChairID;
        gameData.bankerUserChairID = this.bankerUserChairID;

        gameData.userStatusArr = this.userStatusArr;
        gameData.showPublicCardArr = this.showPublicCardArr;

        gameData.curTurnBetCountArr = this.curTurnBetCountArr;
        gameData.totalBetCountArr = this.totalBetCountArr;
        gameData.curTurnMaxBetCount = this.curTurnMaxBetCount;

        gameData.allInUserStatus = this.allInUserStatus;
        gameData.selfCardArr = this.allUserCardArr[chairID];
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
    let user = this.roomFrame.getUserByChairId(entryUserChairId);
    if (!("takeGold" in user.userInfo)){
        let parameter = JSON.parse(this.roomFrame.gameTypeInfo["parameters"] || "{}");
        let maxTake = parameter["maxTake"];
        if (user.userInfo.gold > maxTake){
            user.userInfo.takeGold = maxTake;
        }else{
            user.userInfo.takeGold = user.userInfo.gold;
        }
    }
	if(cb) cb();
};

pro.onEventUserLeave = function(leaveUserChairId, cb) {
    if (this.gameStatus !== gameProto.gameStatus.PLAYING || this.userStatusArr[leaveUserChairId] === gameProto.userStatus.NONE){
        utils.invokeCallback(cb);
    }else{
        this.userStatusArr[leaveUserChairId] = gameProto.userStatus.NONE;
        this.allInUserStatus[leaveUserChairId] = false;
        this.roomFrame.writeUserGameResult([{uid: this.roomFrame.getUserByChairId(leaveUserChairId).userInfo.uid, score: -this.totalBetCountArr[leaveUserChairId]}], cb);
    }
};

pro.isUserEnableLeave = function(chairID) {
    return (this.userStatusArr[chairID] !== gameProto.userStatus.PLAYING);
};

pro.onEventUserOffLine = function(offLineUserChairId, cb) {
    this.offlineUserAutoOperation(offLineUserChairId);
	if(cb) cb();
};

pro.onEventRoomDismiss = function() {
};