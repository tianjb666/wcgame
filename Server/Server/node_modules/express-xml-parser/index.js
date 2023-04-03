var parse = require('xml2js').parseString;
var getBody = require('raw-body');
var is = require('type-is');
function bodyParser(opt) {
  opt = opt || {};
  return function(req, res, next) {
    if (!is(req, opt.type || ['xml'])) return next();
    var getBodyOpt = {
      length: req.headers['content-length'],
      encoding: opt.encoding || 'utf8',
      limit: opt.limit || '100kb'
    };
    getBody(req, getBodyOpt, function(err, body) {
      if (err) return next(err);
      parse(body, opt, function(err, result) {
        if (err) return next(err);
        req.body = result;
        next();
      });
    });
  };
}
module.exports = bodyParser;
