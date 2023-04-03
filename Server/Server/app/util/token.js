var crypto = require('crypto');
var global = require('../constant/global');
module.exports.createToken = function (uid, serverID) {
    var msg = Date.now() + '|' + uid + '|' + serverID;
    var cipher = crypto.createCipher('aes256', global.TOKEN_PWD);
    var enc = cipher.update(msg, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
};
module.exports.parseToken = function (token) {
    var decipher = crypto.createDecipher('aes256', global.TOKEN_PWD);
    var dec;
    try {
        dec = decipher.update(token, 'hex', 'utf8');
        dec += decipher.final('utf8');
    } catch (err) {
        console.error('[token] fail to decrypt token. %j', token);
        return null;
    }
    var ts = dec.split('|');
    if (ts.length !== 3) {

        return null;
    }
    return {uid: ts[1], serverID: ts[2], timekey: Number(ts[0])};
};

let TOKEN_USEFUL_TIME = 30000;
module.exports.checkToken = function (authInfo) {
    if (!authInfo || !authInfo.serverID || !authInfo.timekey || !authInfo.uid) {
        return false;
    }
    let nowTime = Date.now();
    return ((nowTime - authInfo.timekey) < TOKEN_USEFUL_TIME);
};