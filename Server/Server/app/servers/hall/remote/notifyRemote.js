let domain = require('../domain/lifecycleDomain');
let matchServices = require('../../../services/matchServices');

module.exports = function (app) {
    return new remote(app);
};

let remote = function (app) {
    this.app = app;
};
let pro = remote.prototype;

pro.reloadParameterNotify = function(cb){
    domain.loadParameter(cb);
};

pro.exitMatchList = function (uid, cb){
    matchServices.exitMatchList(uid);
    cb();
};