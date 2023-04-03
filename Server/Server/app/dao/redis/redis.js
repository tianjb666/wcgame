let redisClient = module.exports;
let redis = require( 'redis' );
let utils = require( '../../util/utils.js' );
let code = require('../../constant/code');
let _redis;

let redisConfig = require('../../../config/config.js');

redisClient.init = function() {
	_redis = redis.createClient( redisConfig.redis.port, redisConfig.redis.host );
	if(redisConfig.redis.password.length > 0){
        _redis.auth(redisConfig.redis.password, function () {
            console.log('redis auth success');
        });
    }

	_redis.on('connect',function(){
        console.log('connect redis success');
    });

	return _redis;
};

redisClient.set = function (key, value, cb) {
    _redis.set(key, value, function (err, result) {
        if (!!err){
            console.error( err );
        }
        utils.invokeCallback( cb, !!err?code.MYSQL_ERROR:null, result);
    });
};

redisClient.get = function (key, cb) {
    _redis.get(key, function (err, result) {
        if (!!err){
            console.error( err );
        }
        utils.invokeCallback( cb, !!err?code.MYSQL_ERROR:null, result);
    });
};

redisClient.del = function (key, cb) {
    _redis.del(key, function (err, result) {
        if (!!err){
            console.error( err );
        }
        utils.invokeCallback( cb, err, result);
    });
};


redisClient.hset = function( key, field, value, cb ) {
    _redis.hset( key, field, JSON.stringify( value ), function ( err, result ) {
        if( err ) {
            console.error( err );
        }
        utils.invokeCallback( cb, !!err?code.MYSQL_ERROR:null, result );
    });
};

redisClient.hmset = function (key, obj, cb) {
    _redis.hmset(key, obj, function (err, result) {
        if ( err ){
            console.error(err);
        }
        utils.invokeCallback(cb, !!err?code.MYSQL_ERROR:null, result);
    })
};

redisClient.hget = function( key, field, cb ) {
     _redis.hget( key, field, function ( err, result ) {
        if( err ) {
            console.error( err );
        }
        utils.invokeCallback( cb, !!err?code.MYSQL_ERROR:null, result);
    });
};

redisClient.hgetall = function( key, cb ) {
	 _redis.hgetall( key, function ( err, result ) {
        if( err ) {
            console.error( err );
        }
        utils.invokeCallback( cb, !!err?code.MYSQL_ERROR:null, result);
    });
};

redisClient.hdel = function( key, field, cb ) {
    _redis.hdel( key, field, function ( err, result ) {
        if( err ) {
            console.error( err );
        }
        utils.invokeCallback( cb, !!err?code.MYSQL_ERROR:null, result );
    });
};

redisClient.multi = function (multiArr, cb) {
    _redis.multi(multiArr).exec(function (err, result) {
        if (!!err){
            console.error( err );
        }
        utils.invokeCallback( cb, !!err?code.MYSQL_ERROR:null, result );
    })
};

redisClient.exists = function (key, cb) {
    _redis.exists(key, function (err, result) {
        if (err){
            console.error( err );
        }
        utils.invokeCallback(cb, !!err?code.MYSQL_ERROR:null, result);
    })
};

redisClient.hsetWithObj = function (key, obj, cb) {
    obj = utils.clone(obj);
    let multiArr = [];
    let incData = obj['$inc'];
    if (!!incData){
        for (let filed in incData){
            if (incData.hasOwnProperty(filed)){
                multiArr.push(["hincrbyfloat", key, filed, incData[filed]]);
            }
        }
        delete obj['$inc'];
    }

    multiArr.push(['hmset', key, obj]);

    if(multiArr.length > 0){
        _redis.multi(multiArr).exec(function (err) {
            if (!!err){
                console.error( err );
                utils.invokeCallback(cb, code.MYSQL_ERROR);
            }else{
                utils.invokeCallback(cb);
            }
        })
    }else{
        utils.invokeCallback(cb);
    }
};

redisClient.hsetWithObjThenGet = function (key, obj, cb) {
    obj = utils.clone(obj);
    let multiArr = [];
    let incData = obj['$inc'];
    if (!!incData){
        for (let filed in incData){
            if (incData.hasOwnProperty(filed)){
                multiArr.push(["hincrbyfloat", key, filed, incData[filed]]);
            }
        }
        delete obj['$inc'];
    }
    if (utils.getLength(obj) > 0) multiArr.push(['hmset', key, obj]);
    multiArr.push(['hgetall', key]);

    _redis.multi(multiArr).exec(function (err, replies) {
        if (!!err){
            console.error( err );
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, replies.pop());
        }
    })
};

redisClient.keys = function (key, cb) {
    _redis.keys(key, function (err,result) {
        if( err ) {
            console.error( err );
            utils.invokeCallback(cb, code.MYSQL_ERROR);
        }else{
            utils.invokeCallback(cb, null, result);
        }
    })
};
redisClient.flushall = function() {
	 _redis.flushall( function ( err, result ) {
        if( err ) {
            console.error( err );
        }
    });
};