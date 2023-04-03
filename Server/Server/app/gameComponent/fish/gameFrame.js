let utils = require('../../util/utils');
let gameProto = require('./FishGameProto');
let gameLogic = require('./gameLogic');
let fishConfig = require('./fishConfig');
let logger = require('pomelo-logger').getLogger('game');

let ADD_FISH_INTERVAL_TIME = 5 * 1000;                  // 添加鱼的更新时间
let NORMAL_SCENE_MAX_FISH_COUNT = 50;                   // 场景中鱼的最大活跃数量
let START_FISH_COUNT = 30;                              // 开始时场景中鱼的数量
let ROBOT_OPERATION_INTERVAL_TIME = 60 * 1000;          // 机器人操作间隔
let FISH_TIDE_INTERVAL_TIME = 10 * 60 * 1000;           // 鱼潮间隔

let gameFrameBase = require('../gameFrameBase');

let gameFrame =function (roomFrame) {
    gameFrame.super_.call(this, roomFrame);

    this.addFishTimer = null;

    this.userLockFishIDArr = [-1, -1, -1, -1];
    this.bulletCountArr = [0, 0, 0, 0];
    this.winGoldCountArr = [0, 0, 0, 0];
    this.cannonPowerIndexArr = [1, 1, 1, 1];
    this.cannonTypeIndexArr = [-1, -1, -1, -1];
    this.fireCastGoldCountArr = [0, 0, 0, 0];

    this.fishList = {};
    this.curFishID = 0;
    this.isFishTide = false;
};

let pro = gameFrame.prototype;

pro.receivePlayerMessage = function (chairID, msg){
	let type = msg.type || null;
	let data = msg.data || null;
	if (!type || !data) {
        logger.error("fish receivePlayerMessage err:" + JSON.stringify(msg));
        return;
    }

	switch (type){
        case gameProto.GAME_FIRE_NOTIFY:{
        	this.userFire(chairID, data);
            break;
        }
        case gameProto.GAME_CHANGE_CANNON_NOTIFY:{
        	this.userChangeCannon(chairID, data);
            break;
        }
        case gameProto.GAME_CAPTURE_NOTIFY: {
        	this.userCapture(chairID, data);
            break;
        }
		case gameProto.GAME_LOCK_FISH_NOTIFY: {
			this.userLockFish(chairID, data);
			break;
		}
        case gameProto.GAME_ROBOT_FIRE_NOTIFY:{
            for(let i = 0; i < data.chairIDArr.length; ++i){
                let user = this.getUserByChairID(data.chairIDArr[i]);
                if (!user.userInfo.robot) continue;
                this.userFire(data.chairIDArr[i], {rote: data.roteArr[i]});
            }
            break;
        }
        case gameProto.GAME_ROBOT_CAPTURE_NOTIFY: {
            this.userCapture(data.chairID, data);
            break;
        }
        default:{
            logger.error("fish receivePlayerMessage err:type error");
            break;
        }
    }
};

// 开始游戏
pro.startGame = function() {
    this.addFish(true);
	// 开启定时器，对鱼群状态做一次检测
    this.addFishTimer = setInterval(this.addFish.bind(this), ADD_FISH_INTERVAL_TIME);
    // 开启鱼潮定时器
    this.fishTideTimer = setInterval(this.fishTide.bind(this), FISH_TIDE_INTERVAL_TIME);
    // 开启机器人操作定时器
    this.robotOperationTimer = setInterval(this.robotOperation.bind(this), ROBOT_OPERATION_INTERVAL_TIME);
};

pro.userFire = function (chairID, data) {
    let user = this.getUserByChairID(chairID);
    let bulletGoldCount = this.cannonPowerIndexArr[chairID] * this.gameTypeInfo.baseScore || 0.01;
    if (user.userInfo.gold - bulletGoldCount + this.winGoldCountArr[chairID] < 0) {
        logger.error("gold not enough");
        return;
    }
	// 扣除金币
    this.winGoldCountArr[chairID] -= bulletGoldCount;
    // 记录消耗的金币总额
    this.fireCastGoldCountArr[chairID] += bulletGoldCount;
	// 记录子弹数量
    this.bulletCountArr[chairID]++;
	// 推送给全玩家
    this.sendDataExceptChairIDs(gameProto.gameFirePush(chairID, data.rote), [chairID]);
};

pro.userChangeCannon = function (chairID, data) {
    return;
    if (data.powerIndex === null && data.typeIndex === null){
        logger.error("userChangeCannon err");
        return;
    }
    let powerIndex = null;
    if (data.powerIndex !== null){
        powerIndex = Math.floor(data.powerIndex);
        if (powerIndex <= 0 && powerIndex > 10){
            logger.error("userChangeCannon err: powerIndex=" + powerIndex);
            return;
        }
    }
    let typeIndex = null;
    if (data.typeIndex !== null){
        typeIndex = Math.floor(data.typeIndex);
        let user = this.getUserByChairID(chairID);
        if ((typeIndex < 0 && typeIndex > 6) || typeIndex > user.userInfo.vipLevel){
            logger.error("userChangeCannon err: typeIndex=" + typeIndex);
            return;
        }
    }
	// 修改玩家炮状态D
    this.cannonPowerIndexArr[chairID] = powerIndex;
    // 修改玩家炮的种类
    this.cannonTypeIndexArr[chairID] = typeIndex;
	// 推送给其他玩家
    this.sendDataExceptChairIDs(gameProto.gameChangeCannonPush(chairID, powerIndex, typeIndex), [chairID]);
};

pro.userCapture = function (chairID, data) {
    let user = this.getUserByChairID(chairID);
    if (!user){
        logger.error("user not find");
        return;
    }
    // 计算子弹数量
    if (this.bulletCountArr[chairID] <= 0) {
        logger.error("bullet count < 0");
        return;
    }
    this.bulletCountArr[chairID]--;
    // 验证鱼
    let fish = this.fishList[data.fishID];
    if (!fish){
        logger.error("fish not find");
        return;
    }
    let fishInfo = fishConfig.fishType[fish.fishTypeID];
    if (!fishInfo){
        logger.error("fish type not find");
        return;
    }
	// 计算是否打中
    let isCapture = Math.random() < fishInfo.probability * (1 - this.roomFrame.getCurRobotWinRate());
	// 打中则推送打中消息
    if (isCapture){
        // 判断是否是爆炸鱼
        if (fishInfo.bomb){
            // 删除鱼
            delete this.fishList[data.fishID];
            // 爆炸捕获身边其他小鱼
            let fishIDArr = [data.fishID];
            let gainGoldArr = [0];   // 爆炸鱼本身没有金币
            let bulletGoldCount = this.cannonPowerIndexArr[chairID] * this.gameTypeInfo.baseScore || 0.01;
            for (let key in this.fishList){
                if (this.fishList.hasOwnProperty(key)){
                    let temp = fishConfig.fishType[this.fishList[key].fishTypeID];
                    if (temp.bombCapture){
                        fishIDArr.push(parseInt(key));
                        let gainGold = bulletGoldCount * temp.rewardTimes;
                        this.winGoldCountArr[chairID] += gainGold;
                        gainGoldArr.push(gainGold);
                        delete this.fishList[key];
                    }
                }
            }
            this.sendDataToAll(gameProto.gameCapturePush(chairID, fishIDArr, gainGoldArr, this.winGoldCountArr[chairID]));
        }else{
            // 删除鱼
            delete this.fishList[data.fishID];
            // 计算获得金币
            let bulletGoldCount = this.cannonPowerIndexArr[chairID] * this.gameTypeInfo.baseScore || 0.01;
            let gainGold = bulletGoldCount * fishInfo.rewardTimes;
            this.winGoldCountArr[chairID] += gainGold;
            this.sendDataToAll(gameProto.gameCapturePush(chairID, [data.fishID], [gainGold], this.winGoldCountArr[chairID]));
        }
    }
};

pro.userLockFish = function (chairID, data) {
    if (data.fishID >= 0 && !this.fishList[data.fishID]) return;
	// 记录锁定状态
    this.userLockFishIDArr[chairID] = data.fishID;
	// 推送给其他玩家
    this.sendDataToAll(gameProto.gameLockFishPush(chairID, data.fishID));
};

pro.addFish = function (isStart) {
    // 鱼潮时不另外添加鱼
    if(this.isFishTide) return;
    // 移除需要删除的鱼
    let timeNow = Date.now();
    for(let key in this.fishList){
        if(this.fishList.hasOwnProperty(key)){
            let fish = this.fishList[key];
            if (timeNow> fish.removeTime){
                delete this.fishList[key];
            }
        }
    }
    // 加入新的鱼
    let addFishArr = [];
    let fishCount = utils.getLength(this.fishList);
    for (let i = fishCount; i < NORMAL_SCENE_MAX_FISH_COUNT; ++i){
        let offsetTime = (isStart?utils.getRandomNum(5000, 15000):utils.getRandomNum(1000, 5000));
        let fish = {
            fishID: this.curFishID++,
            fishTypeID: gameLogic.getCreateFishTypeID(this.fishList),
            pathArr: gameLogic.getCreateFishPathArr(),
            createTime: timeNow - offsetTime
        };
        fish.removeTime =  gameLogic.getRemoveTime(fish.pathArr, fish.fishTypeID, fishConfig.fishMoveBaseSpeed) + timeNow - offsetTime;
        addFishArr.push(fish);
        this.fishList[fish.fishID] = fish;
        if (addFishArr.length >= (isStart?START_FISH_COUNT: (NORMAL_SCENE_MAX_FISH_COUNT - fishCount)/3))break;
    }
    if (addFishArr.length > 0){
        // 通知其他玩家
        this.sendDataToAll(gameProto.gameAddFishPush(addFishArr));
    }
};

// 鱼潮事件
pro.fishTide = function () {
    if (this.isFishTide) return;
    this.isFishTide = true;
    // 清除所有鱼
    this.fishList = {};
    // 通知所有玩家
    this.sendDataToAll(gameProto.gameTideStartPush(this.curFishID));
    // 创建鱼潮中的鱼
    let timeNow = Date.now();
    for (let i = 0; i < fishConfig.fishTide.length; ++i){
        let tideInfo = fishConfig.fishTide[i];
        let midPos = {x: 0, y: tideInfo.startPos.y * fishConfig.unitLengthY};
        let endPos = {x: 10 * fishConfig.unitLengthX, y: tideInfo.startPos.y * fishConfig.unitLengthY};
        for (let j = 0; j < tideInfo.maxCount; ++j){
            let startPos = {y: tideInfo.startPos.y * fishConfig.unitLengthY};
            startPos.x = (tideInfo.startPos.x - j * tideInfo.space) * fishConfig.unitLengthX;
            let fish = {
                fishID: this.curFishID++,
                fishTypeID: tideInfo.fishTypeID,
                createTime: timeNow,
                pathArr: [startPos, midPos, endPos],
                tide: true
            };
            this.fishList [fish.fishID] = fish;
        }
    }
    // 鱼潮结束的定时器
    this.fishTideEndTimer = setTimeout(function () {
        // 修改状态
        this.isFishTide = false;
        // 清楚所有的鱼
        this.fishList = {};
        // 清除定时器
        this.fishTideEndTimer = null;
    }.bind(this), (fishConfig.fishContinueTime - 5) * 1000);
};

pro.robotOperation = function () {
    this.roomFrame.robotOperationConcludeGame();
};

/*********************************以下为gameFrame必须实现接口,供roomFrame调用******************************************/
/**
 * 返回游戏场景数据
 */
pro.getEnterGameData = function() {
    return {
        userLockFishIDArr: this.userLockFishIDArr,
        winGoldCountArr: this.winGoldCountArr,
        fishList: this.fishList,
        cannonPowerIndexArr: this.cannonPowerIndexArr,
        cannonTypeIndexArr: this.cannonTypeIndexArr,
        baseScore: this.gameTypeInfo.baseScore || 0.01,
        serverTime: Date.now(),
        profitPercentage: this.publicParameter.profitPercentage
    };
};

/**
 * 游戏开始时调用
 */
pro.onEventGameStart = function() {
	this.startGame();
};

/**
 * 玩家离开时调用
 * @param chairID
 */
pro.onEventUserLeave = function(chairID) {
    // 清理数据
    this.userLockFishIDArr[chairID] = -1;
    this.bulletCountArr[chairID] = 0;
    let winGold = this.winGoldCountArr[chairID];
    this.winGoldCountArr[chairID] = 0;
    this.cannonPowerIndexArr[chairID] = 1;
    this.cannonTypeIndexArr[chairID] = -1;
    let betScore = this.fireCastGoldCountArr[chairID];
    this.fireCastGoldCountArr[chairID] = 0;
    // 存储数据信息
    if (winGold !== 0) {
        let user = this.getUserByChairID(chairID);
        let data = {
            uid: user.userInfo.uid,
            score: winGold,
            betScore: betScore
        };
        this.roomFrame.writeUserGameResult([data]);
    }
};

/**
 * 玩家是否可以离开
 * @returns {boolean}
 */
pro.isUserEnableLeave = function() {
    return true;
};

/**
 * 房间解散时调用
 */
pro.onEventRoomDismiss = function() {
    this.addFishTimer && clearInterval(this.addFishTimer);
    this.robotOperationTimer && clearInterval(this.robotOperationTimer);
    this.fishTideTimer && clearInterval(this.fishTideTimer);
    this.fishTideEndTimer && clearTimeout(this.fishTideEndTimer);
    this.gameFrame = null;
};

require('util').inherits(gameFrame, gameFrameBase);
module.exports = gameFrame;