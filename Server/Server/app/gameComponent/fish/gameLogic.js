let fishConfig = require('./fishConfig');
let utils = require('../../util/utils');
let gameLogic = module.exports = {};

gameLogic.getCaptureProbability = function(fishType, cannonType){
    return Math.random();
};

gameLogic.getCreateFishTypeID = function (curFishList) {
    // 保证同一时间只出现一个boss
    let index;
    // 百分之85概率出小鱼
    let rand = Math.random();
    if (rand < 0.55){
        index = utils.getRandomNum(0, 7);
    }else if (rand < 0.85){
        index = utils.getRandomNum(8, 14);
    }else if (rand < 0.995){
        index = utils.getRandomNum(15, fishConfig.fishType.length - 2);
    }else{
        // boss出现概率是0.5%
        index = fishConfig.fishType.length - 1;
    }
    let info = fishConfig.fishType[index];
    if (!!info.boss){
        let isExistBoss = false;
        for (let key in curFishList){
            if (curFishList.hasOwnProperty(key)){
                let fish = fishConfig.fishType[curFishList[key].fishTypeID];
                if (!!fish.boss){
                    isExistBoss = true;
                    break;
                }
            }
        }
        if (isExistBoss){
            return gameLogic.getCreateFishTypeID(curFishList);
        }
    }
    return index;
};

gameLogic.getCreateFishPathArr = function () {
    // 将地图区域分成 20 * 20个点，选取3个点形成贝塞尔曲线，作为鱼移动的路径
    // 起始点必须是左右两边界
    let startPos = {
        x: (utils.getRandomNum(0,1) === 0)?-10:10,
        y: utils.getRandomNum(-10, 10)
    };
    // 中间点必须在 [-5, 5] 之间
    let midPos = {
        x: utils.getRandomNum(-5, 5),
        y: utils.getRandomNum(-5, 5)
    };
    // 结算点必须在另一侧的边界
    // 0=结束点在左右， 1=结束点在上下
    let endPos = {x: 0, y: 0};
    if (utils.getRandomNum(0, 1) === 0){
        // 终点和起点不能再mid点的同一侧
        endPos.x = (startPos.x === -10)?10: -10;
        endPos.y = utils.getRandomNum(-10, 10);
    }else{
        // 终点和起点不能再mid点的同一侧
        endPos.y = (utils.getRandomNum(0, 1) === 0)?-10:10;
        if (startPos.x === -10){
            endPos.x = utils.getRandomNum(midPos.x, 10);
        }else{
            endPos.x = utils.getRandomNum(-10, midPos.x);
        }
    }
    startPos.x *= fishConfig.unitLengthX;
    startPos.y *= fishConfig.unitLengthY;

    midPos.x *= fishConfig.unitLengthX;
    midPos.y *= fishConfig.unitLengthY;

    endPos.x *= fishConfig.unitLengthX;
    endPos.y *= fishConfig.unitLengthY;
    return [startPos, midPos, endPos];
};

gameLogic.getRemoveTime = function (pathArr, fishTypeID, speed) {
    let fishInfo = fishConfig.fishType[fishTypeID];
    let len = utils.getDist(pathArr[0], pathArr[1]) + utils.getDist(pathArr[1], pathArr[2]);
    return len/speed/fishInfo.moveSpeed * 1000;
};