var pomelo = require('pomelo');
var sync = require('pomelo-sync-plugin');
var httpPlugin = require('pomelo-http-plugin');
var routeUtil = require('./app/util/routeUtil');
var logger = require('pomelo-logger').getLogger("pomelo");

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'PokerGame');

// route configuration
app.configure('production|development', function() {
    app.route('hall', routeUtil.hall);
    app.route('connector', routeUtil.connector);
    app.route('game', routeUtil.game);
});

app.configure('production|development', 'connector', function(){
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            heartbeat : 30,
            useProtobuf: false
        });

    let mongoClient = require('./app/dao/mongo/models');
    app.set('dbClient', mongoClient);

    let redisClient = require('./app/dao/redis/redis');
    redisClient.init();
    app.set('redisClient', redisClient);
});

app.configure('production|development', 'hall', function () {
   app.set('connectorConfig',{
       connector : pomelo.connectors.hybridconnector,
       heartbeat : 30,
       useProtobuf: false
   });

    let mongoClient = require('./app/dao/mongo/models');
    app.set('dbClient', mongoClient);

    let redisClient = require('./app/dao/redis/redis');
    redisClient.init();
    app.set('redisClient', redisClient);


    // 加载异步
    app.use(sync, {sync: {path:__dirname + '/app/dao/mapping', dbclient: mongoClient}});
});

app.configure('production|development', 'game', function () {
    app.set('connectorConfig',{
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 30,
        useProtobuf: false
    });

    let mongoClient = require('./app/dao/mongo/models');
    app.set('dbClient', mongoClient);

    let redisClient = require('./app/dao/redis/redis');
    redisClient.init();
    app.set('redisClient', redisClient);

    let roomManager = require('./app/servers/game/domain/roomManager');
    roomManager.init(app);
    app.roomManager = roomManager;
});

app.configure('production|development', 'robot', function () {
    app.set('connectorConfig',{
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 30,
        useProtobuf: false
    });

    let mongoClient = require('./app/dao/mongo/models');
    app.set('dbClient', mongoClient);

    let redisClient = require('./app/dao/redis/redis');
    redisClient.init();
    app.set('redisClient', redisClient);
});

app.configure('production|development', 'http', function() {
    app.loadConfig('httpConfig', app.getBase() + '/config/http.json');
    app.use(httpPlugin, {
        http: app.get('httpConfig')[app.getServerId()]
    });

    let mongoClient = require('./app/dao/mongo/models');
    app.set('dbClient', mongoClient);

    let redisClient = require('./app/dao/redis/redis');
    redisClient.init();
    app.set('redisClient', redisClient);
});

app.configure('production|development', 'center', function() {
    app.set('connectorConfig',{
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 30,
        useProtobuf: false
    });

    let mongoClient = require('./app/dao/mongo/models');
    app.set('dbClient', mongoClient);

    let redisClient = require('./app/dao/redis/redis');
    redisClient.init();
    app.set('redisClient', redisClient);

    let hallManager = require('./app/servers/center/domain/hallManager');
    hallManager.init();
    app.hallManager = hallManager;
});

// start app
app.start();

process.on('uncaughtException', function (err) {
    logger.error(' Caught exception: ' + err.stack);
});
