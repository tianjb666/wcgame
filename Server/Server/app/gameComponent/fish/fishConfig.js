let exp = module.exports;

/**
 * resIndex:资源索引
 * rewardTimes：奖励倍数
 * moveSpeed：移动速度
 * animationSpeed：动画速度
 * bombCapture：是否被银龙爆炸时捕获
 * fishBoomEffect：被捕获时是不是有爆炸特效
 * boss：是否是boss，boss出现将会出现提示
 * bomb：死亡时是否会发生爆炸，捕获其他鱼
 * fixedRotation：锁定旋转，不会因为游动方向而改变动画角度
 * probability：捕获概率
 */
exp.fishType = [
    {resIndex: 0, probability: 0.5, rewardTimes: 2, moveSpeed: 1, animationSpeed: 1, bombCapture: true},
    {resIndex: 1, probability: 0.5, rewardTimes: 2, moveSpeed: 1, animationSpeed: 1, bombCapture: true},
    {resIndex: 2, probability: 0.333, rewardTimes: 3, moveSpeed: 0.95, animationSpeed: 0.8, bombCapture: true},
    {resIndex: 3, probability: 0.25, rewardTimes: 4, moveSpeed: 0.95, animationSpeed: 0.8, bombCapture: true},
    {resIndex: 4, probability: 0.2, rewardTimes: 5, moveSpeed: 0.9, animationSpeed: 0.8, bombCapture: true},
    {resIndex: 5, probability: 0.166, rewardTimes: 6, moveSpeed: 0.85, animationSpeed: 0.7, bombCapture: true},
    {resIndex: 6, probability: 0.142, rewardTimes: 7, moveSpeed: 0.8, animationSpeed: 0.87, bombCapture: true},
    {resIndex: 7, probability: 0.125, rewardTimes: 8, moveSpeed: 0.8, animationSpeed: 0.7, bombCapture: true},
    {resIndex: 8, probability: 0.111, rewardTimes: 9, moveSpeed: 0.65, animationSpeed: 0.7, bombCapture: true},
    {resIndex: 9, probability: 0.1, rewardTimes: 10, moveSpeed: 0.65, animationSpeed: 0.6, bombCapture: true},
    {resIndex: 10, probability: 0.083, rewardTimes: 12,  moveSpeed: 0.65, animationSpeed: 0.6, bombCapture: true},
    {resIndex: 11, probability: 0.055, rewardTimes: 18,  moveSpeed: 0.65, animationSpeed: 0.6, bombCapture: true},
    {resIndex: 12, probability: 0.055, rewardTimes: 18,  moveSpeed: 0.6, animationSpeed: 0.6, bombCapture: true},
    {resIndex: 13, probability: 0.05, rewardTimes: 20,  moveSpeed: 0.6, animationSpeed: 0.6, bombCapture: true},
    {resIndex: 14, probability: 0.04, rewardTimes: 25,  moveSpeed: 0.6, animationSpeed: 0.5},
    {resIndex: 15, probability: 0.033, rewardTimes: 30,  moveSpeed: 0.55, animationSpeed: 0.5},
    {resIndex: 16, probability: 0.0285, rewardTimes: 35,  moveSpeed: 0.5, animationSpeed: 0.5},
    {resIndex: 17, probability: 0.025, rewardTimes: 40,  moveSpeed: 0.45, animationSpeed: 0.4},
    {resIndex: 18, probability: 0.0222, rewardTimes: 45,  moveSpeed: 0.4, animationSpeed: 0.4},
    {resIndex: 21, probability: 0.02, rewardTimes: 50,  moveSpeed: 0.35, animationSpeed: 0.4, fishBoomEffect: true},
    {resIndex: 23, probability: 0.0142, rewardTimes: 70,  moveSpeed: 0.35, animationSpeed: 0.4, fishBoomEffect: true},
    {resIndex: 25, probability: 0.0125, rewardTimes: 80,  moveSpeed: 0.35, animationSpeed: 0.3, fishBoomEffect: true},
    {resIndex: 26, probability: 0.01, rewardTimes: 100,  moveSpeed: 0.3, animationSpeed: 0.3, fishBoomEffect: true},
    {resIndex: 27, probability: 0.0083, rewardTimes: 120,  moveSpeed: 0.3, animationSpeed: 0.3, toad: true, fishBoomEffect: true},
    {resIndex: 32, probability: 0.005, rewardTimes: 0,  moveSpeed: 0.3, animationSpeed: 0.3, bomb: true, fixedRotation: true, fishBoomEffect: true},
    {resIndex: 31, probability: 0.005, rewardTimes: 200, moveSpeed: 0.25, animationSpeed: 0.3, boss: true, fixedRotation: true, fishBoomEffect: true}
];

// 单位点的长宽，鱼的范围1800 * 1000， 分成20 * 20个点
exp.unitLengthX = 90;
exp.unitLengthY = 50;

// 鱼每秒移动的标准距离
exp.fishMoveBaseSpeed = 100;

// 鱼群设置
exp.fishTide = [
    {fishTypeID: 0, startPos: {x: -9.5, y: 3.5}, space: 1, maxCount: 38},
    {fishTypeID: 0, startPos: {x: -9.5, y: -3.5}, space: 1, maxCount: 38},

    {fishTypeID: 1, startPos: {x: -9, y: -2.75}, space: 1, maxCount: 39},
    {fishTypeID: 1, startPos: {x: -9, y: 2.75}, space: 1, maxCount: 39},

    {fishTypeID: 2, startPos: {x: -9, y: -2}, space: 0.75, maxCount: 52},
    {fishTypeID: 2, startPos: {x: -9, y: 2}, space: 0.75, maxCount: 52},

    {fishTypeID: 4, startPos: {x: -9, y: -1.2}, space: 0.75, maxCount: 5},
    {fishTypeID: 4, startPos: {x: -9, y: 1.2}, space: 0.75, maxCount: 5},
    {fishTypeID: 5, startPos: {x: -9, y: 0}, space: 0.75, maxCount: 5},

    {fishTypeID: 18, startPos: {x: -14, y: 0}, space: 0, maxCount: 1},
    {fishTypeID: 19, startPos: {x: -17, y: 0}, space: 0, maxCount: 1},
    {fishTypeID: 23, startPos: {x: -20, y: 0}, space: 0, maxCount: 1},
    {fishTypeID: 20, startPos: {x: -23, y: 0}, space: 0, maxCount: 1},

    {fishTypeID: 4, startPos: {x: -26, y: -1.2}, space: 0.75, maxCount: 4},
    {fishTypeID: 4, startPos: {x: -26, y: 1.2}, space: 0.75, maxCount: 4},
    {fishTypeID: 5, startPos: {x: -26, y: 0}, space: 0.75, maxCount: 4},

    {fishTypeID: 23, startPos: {x: -30, y: 0}, space: 0, maxCount: 1},
    {fishTypeID: 22, startPos: {x: -34, y: 0}, space: 0, maxCount: 1},
    {fishTypeID: 23, startPos: {x: -38, y: 0}, space: 0, maxCount: 1},
    {fishTypeID: 21, startPos: {x: -42, y: 0}, space: 0, maxCount: 1},

    {fishTypeID: 4, startPos: {x: -45, y: -1.2}, space: 0.75, maxCount: 4},
    {fishTypeID: 4, startPos: {x: -45, y: 1.2}, space: 0.75, maxCount: 4},
    {fishTypeID: 5, startPos: {x: -45, y: 0}, space: 0.75, maxCount: 4}
];

exp.fishTideMoveSpeed = 0.6;
exp.fishContinueTime = 50 * exp.unitLengthX/exp.fishMoveBaseSpeed/exp.fishTideMoveSpeed;