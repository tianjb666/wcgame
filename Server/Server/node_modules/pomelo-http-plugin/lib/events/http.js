'use strict';
module.exports = function(app, opts) {
 return new Event(app, opts);
};

var Event = function(app, opts) {
 //do construction
};

Event.prototype.add_servers = function(servers) {
 //do something when application add servers
};

Event.prototype.remove_servers = function(ids) {
 //do something when application remove servers
};

Event.prototype.replace_servers = function(servers) {
 //do something when server reconnected
};

Event.prototype.bind_session = function(session) {
 //do something when session binded
};

Event.prototype.close_session = function(session) {
 //do something when session closed
};
