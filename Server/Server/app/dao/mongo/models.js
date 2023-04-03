var mongoose = require('mongoose');
var autoIncrement = require("mongoose-auto-increment");
var Schema = mongoose.Schema;
var Util = require('util');

var dbConfig = require('../../../config/config.js');
var formatStr = 'mongodb://%s:%s/%s';
var MongoDbAddress;
if (dbConfig.mongo.user !== null && dbConfig.mongo.password !== null){
    formatStr = 'mongodb://%s:%s@%s:%s/%s';
    MongoDbAddress = Util.format(formatStr, dbConfig.mongo.user, dbConfig.mongo.password, dbConfig.mongo.host, dbConfig.mongo.port, dbConfig.mongo.database);
} else {
    formatStr = 'mongodb://%s:%s/%s';
    MongoDbAddress = Util.format(formatStr, dbConfig.mongo.host, dbConfig.mongo.port, dbConfig.mongo.database);
}

var options = {
    auth: {authdb: "admin"},
    db: {native_parser: true},
    server: {poolSize: 5},
    user: dbConfig.mongo.user,
    pass: dbConfig.mongo.password
};
var db = mongoose.createConnection(MongoDbAddress, options);
autoIncrement.initialize(db);

// 帐号
var accountSchema = new Schema({
    account: {type: String, default: ""},
    password: {type: String, default: ""},
    phoneAccount: {type: String, default: ""},
    wxAccount: {type: String, default: ""},
    spreaderID: {type: String, default: ""}
});

accountSchema.plugin(autoIncrement.plugin, {
    model: 'account',
    field: 'uid',
    startAt: 100000,
    incrementBy: 1
});

db.model('account', accountSchema);
exports.accountModel = db.model('account');

// 管理员
var adminSchema = new Schema({
    account: {type: String, default: ""},
    password: {type: String, default: ""},
    permission: {type: Number, default: 0},
    nickname: {type: String, default: ""},
    createTime: {type: Number, default: 0}
});

adminSchema.plugin(autoIncrement.plugin, {
    model: 'admin',
    field: 'uid',
    startAt: 100000,
    incrementBy: 1
});

db.model('admin', adminSchema);
exports.adminModel = db.model('admin');

// 用户
var userSchema = new Schema({
    account: {type: String, default: ""},                       // 帐号
    channelID: {type: String, default: "0"},                     // 渠道ID

    uid: {type: String, default: ""},                           // 用户唯一ID
    nickname: {type: String, default: ""},                      // 昵称
    sex: {type: Number, default: 0},                            // 性别，男0，女1
    avatar: {type: String, default: ""},                        // 头像

    gold: {type: Number, default: 0},                           // 金币
    safeGold: {type: Number, default: 0},                       // 保险柜金币
    safePassword: {type: String, default: ""},                  // 保险柜密码

    rechargeNum: {type: Number, default: 0},                    // 充值总额
    rechargeTimes: {type: Number, default: 0},                  // 充值次数

    todayWinGoldCount: {type: Number, default: 0},              // 今日赢金币数量

    permission: {type: Number, default: 1},                     // 帐号权限制

    // 银行卡信息
    bankCardInfo: {type: String, default: ""},
    //{
    //    cardNumber: {type: String, default: ""},
    //    bankName: {type: String, default: ""},
    //    ownerName: {type: String, default: ""}
    //},

    // 支付宝信息
    aliPayInfo: {type: String, default: ""},
    //     {
    //     ownerName: {type: String, default: ""},                 // 支付宝姓名
    //     aliPayAccount: {type: String, default: ""},             // 支付宝帐号
    // },

    spreaderID: {type: String, default: ""},                    // 我的推广人员ID
    achievement: {type: Number, default: 0},                    // 自己业绩
    // 推广信息
    directlyMemberAchievement: {type: Number, default: 0},  // 直属会员业绩
    agentMemberAchievement: {type: Number, default: 0},     // 代理会员业绩
    thisWeekLowerAgentCommision: {type: Number, default: 0},// 本周下级代理的佣金
    realCommision: {type: Number, default: 0},              // 可提现佣金
    totalCommision: {type: Number, default: 0},             // 总佣金
    lowerAgentCommision: {type: Number, default: 0},        // 下级代理总佣金

    directlyMemberCount: {type: Number, default: 0},        // 直属会员
    weekAddedDirectlyMemberCount: {type: Number, default: 0},  // 本周新增直属会员数量
    monthAddedDirectlyMemberCount: {type: Number, default: 0}, // 本月新增直属会员数量

    agentMemberCount: {type: Number, default: 0},           // 代理数量
    weekAddedAgentMemberCount: {type: Number, default: 0},  // 本周新增代理数量
    monthAddedAgentMemberCount: {type: Number, default: 0},  // 本月新增代理数量

    emailArr: {type: String, default: ""},                    // 邮件列表

    createTime: {type: Number, default: 0},                     // 创建时间
    lastLoginTime: {type: Number, default: 0},                // 最后登录时间
    createLoginIP: {type: String, default: ""}                  // 最后登录IP
});

db.model('user', userSchema);
exports.userModel = db.model('user');

// 通用参数
var publicParameterSchema = new Schema({
    key: {type: String, default: ""},
    value: {type: String, default: ""},
    describe: {type: String, default: ""}
});
db.model('publicParameter', publicParameterSchema);
exports.publicParameterModel = db.model('publicParameter');

// 游戏类型
var gameTypeSchema = new Schema({
    gameTypeID: {type: String, default: ""},
    kind: {type: Number, default: 0},
    level: {type: Number, default: 0},
    minPlayerCount: {type: Number, default: 0},
    maxPlayerCount : {type: Number, default: 0},
    expenses: {type: Number, default: 0},
    baseScore: {type: Number, default: 1},
    goldLowerLimit: {type: Number, default: 0},
    goldUpper:{type: Number, default: 0},
    matchRoom: {type: Number, default: 0},
    minRobotCount: {type: Number, default: 0},
    maxRobotCount: {type: Number, default: 0},
    maxDrawCount: {type: Number, default: 0},
    hundred: {type: Number, default: 0},
    parameters: {type: String, default: "{}"},
});
db.model('gameType', gameTypeSchema);
exports.gameTypeModel = db.model('gameType');

// 赠送记录
var adminGrantRecordSchema = new Schema({
    uid: {type: String, default: ""},
    nickname: {type: String, default: ""},
    gainUid: {type: String, default: ""},
    type: {type: String, default: ""},
    count: {type: String, default: ""},
    createTime: {type: Number, default: 0}
});
db.model('adminGrantRecord', adminGrantRecordSchema);
exports.adminGrantRecordModel = db.model('adminGrantRecord');

// 库存抽取记录
var inventoryValueExtractRecordSchema = new Schema({
    kind: {type: Number, default: 0},
    count: {type: Number, default: 0},
    leftCount: {type: Number, default: 0},
    createTime: {type: Number, default: 0}
});
db.model('inventoryValueExtractRecord', inventoryValueExtractRecordSchema);
exports.inventoryValueExtractRecordModel = db.model('inventoryValueExtractRecord');

// 修改库存记录
var modifyInventoryValueRecordSchema = new Schema({
    uid: {type: String, default: ""},
    kind: {type: Number, default: 0},
    count: {type: Number, default: 0},
    leftCount: {type: Number, default: 0},
    createTime: {type: Number, default: 0}
});
db.model('modifyInventoryValueRecord', modifyInventoryValueRecordSchema);
exports.modifyInventoryValueRecordModel = db.model('modifyInventoryValueRecord');

// 每日抽水总量记录
var gameProfitRecordSchema = new Schema({
    day: {type: Number, default: 0},
    count: {type: Number, default: 0}
});
db.model('gameProfitRecord', gameProfitRecordSchema);
exports.gameProfitRecordSchemaModel = db.model('gameProfitRecord');

// 代理返利设置
var agentProfitSchema = new Schema({
    index: {type: String, default: ""},
    level: {type: String, default: ""},
    min: {type: Number, default: 0},
    max: {type: Number, default: 0},
    proportion: {type: Number, default: 0},
});
db.model('agentProfit', agentProfitSchema);
exports.agentProfitModel = db.model('agentProfit');

// 提现申请记录
var withdrawCashRecordSchema = new Schema({
    uid: {type: String, default: ""},
    count: {type: Number, default: 0},                          // 提现金额
    curGold: {type: Number, default: 0},                        // 当前金币
    account: {type: String, default: ""},                       // 银行卡
    ownerName: {type: String, default: ""},                     // 持卡人姓名
    status: {type: Number, default: 0},                         // 记录状态
    type: {type: Number, default: 0},                           // 提款类型
    channelID: {type: String, default: "0"},
    createTime: {type: Number, default: 0}
});

withdrawCashRecordSchema.plugin(autoIncrement.plugin, {
    model: 'withdrawCashRecord',
    field: 'index',
    startAt: 1000000,
    incrementBy: 1
});

db.model('withdrawCashRecord', withdrawCashRecordSchema);
exports.withdrawCashRecordModel = db.model('withdrawCashRecord');

// 提取佣金记录
var extractionCommissionRecordSchema = new Schema({
    uid: {type: String, default: ""},
    count: {type: Number, default: 0},                          // 提取金额
    remainderCount: {type: Number, default: 0},                 // 剩余金额
    curGold: {type: Number, default: 0},                        // 当前金币
    createTime: {type: Number, default: 0}
});

extractionCommissionRecordSchema.plugin(autoIncrement.plugin, {
    model: 'extractionCommissionRecord',
    field: 'index',
    startAt: 1000000,
    incrementBy: 1
});

db.model('extractionCommissionRecord', extractionCommissionRecordSchema);
exports.extractionCommissionRecordModel = db.model('extractionCommissionRecord');

// 发起订单记录
var rechargeOrderRecordSchema = new Schema({
    orderID: {type: String, default: ""},
    uid: {type: String, default: ""},
    itemID: {type: String, default: ""},
    createTime: {type: Number, default: 0}
});
db.model('rechargeOrderRecord', rechargeOrderRecordSchema);
exports.rechargeOrderRecordModel = db.model('rechargeOrderRecord');

// 充值记录
var rechargeRecordSchema = new Schema({
    uid: {type: String, default: ""},
    nickname: {type: String, default: ""},
    spreaderID: {type: String, default: "0"},
    channelID: {type: String, default: "0"},
    createTime: {type: Number, default: 0},
    rechargeMoney: {type: Number, default: 0},
    diamondCount: {type: Number, default: 0},
    couponCount: {type: Number, default: 0},
    purchaseItemID: {type: String, default: ""},
    userOrderID: {type: String, default: ""},
    platformReturnOrderID: {type: String, default: ""},
    platform: {type: String, default: ""}
});
rechargeRecordSchema.plugin(autoIncrement.plugin, {
    model: 'rechargeRecord',
    field: 'index',
    startAt: 1000000,
    incrementBy: 1
});
db.model('rechargeRecord', rechargeRecordSchema);
exports.rechargeRecordModel = db.model('rechargeRecord');

// 充值记录
var rechargeRecordReduceSchema = new Schema({
});
db.model('rechargeRecordReduce', rechargeRecordReduceSchema);
exports.rechargeRecordReduceModel = db.model('rechargeRecordReduce');

// 游戏记录
var gameRecordSchema = new Schema({
    nameArr: {type: [String], default: []},
    uidArr: {type: [String], default: []},
    avatarArr: {type: [String], default: []},
    roomId: {type: String, default: ""},
    cardsArr: {type: [Number], default: []},
    dateArr: {type: [Number], default: []},
    guaiArr: {type: [Boolean], default: []},
    scoresArr: {type: [Number], default: []},
    gameRule: {type: String, default: ""},
    createTime: {type: Number, default: 0}
});
db.model('gameRecord', gameRecordSchema);
exports.gameRecordModel = db.model('gameRecord');

// 玩家游戏记录
var userGameRecordSchema = new Schema({
    uid: {type: String, default: ""},
    drawID: {type: String, default: ""},
    kind: {type: Number, default: 0},
    roomLevel: {type: Number, default: 0},
    changeGold: {type: Number, default: 0},
    createTime: {type: Number, default: 0}
});
userGameRecordSchema.plugin(autoIncrement.plugin, {
    model: 'userGameRecord',
    field: 'index',
    startAt: 1000000,
    incrementBy: 1
});
db.model('userGameRecord', userGameRecordSchema);
exports.userGameRecordModel = db.model('userGameRecord');

// 游戏控制记录
var gameControlDataSchema = new Schema({
    kind: {type: Number, default: 0},
    curInventoryValue: {type: Number, default: 0},
    minInventoryValue: {type: Number, default: 0},
    extractionRatio: {type: Number, default: 0},
    robotEnable: {type: Number, default: 0},
    robotMatchEnable: {type: Number, default: 0},
    maxRobotCount: {type: Number, default: 0},
    robotWinRateArr: [{
        index: {type: Number, default: 0},
        inventoryValue: {type: Number, default: 0},
        winRate: {type: Number, default: 0}
    }]
});
db.model('gameControlData', gameControlDataSchema);
exports.gameControlDataModel = db.model('gameControlData');

// 登录记录
var loginRecordSchema = new Schema({
    uid: {type: String, default: ""},
    ip: {type: String, default: ""},
    createTime: {type: Number, default: 0}
});

loginRecordSchema.plugin(autoIncrement.plugin, {
    model: 'loginRecord',
    field: 'index',
    startAt: 1000000,
    incrementBy: 1
});

db.model('loginRecord', loginRecordSchema);
exports.loginRecordModel = db.model('loginRecord');
