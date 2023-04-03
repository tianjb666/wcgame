/**
 * Created by 52835 on 2017/7/27.
 */
var dispatch = require('./dispatcher');
var code = require('../constant/code');
var exp = module.exports;

exp.hall = function(session, msg, app, cb) {
    var uid = session.uid;
    if(!uid) {
        console.error('can not find hall id');
        cb(code.INVALID_UERS);
        return;
    }
    var server = dispatch.dispatch(uid, app.getServersByType('hall'));
    if (!server){
        console.error('can not dispatcher game server');
        cb(code.FAIL);
    }else{
        cb(null, server.id);
    }
};

exp.game = function(session, msg, app, cb) {
    var roomID = session.get('roomID');
    if(!roomID) {
        console.error('can not find room id');
        cb(code.GAME.ROOM_HAS_DISMISS_SHOULD_EXIT);
        return;
    }
    var server = dispatch.dispatch(roomID, app.getServersByType('game'));
    if (!server){
        console.error('can not dispatcher game server');
        cb(code.FAIL);
    }else{
        cb(null, server.id);
    }
};

exp.connector = function(session, msg, app, cb) {
    if(!session) {
        cb(new Error('fail to route to connector server for session is empty'));
        return;
    }

    if(!session.frontendId) {
        cb(new Error('fail to find frontend id in session'));
        return;
    }

    cb(null, session.frontendId);
};
