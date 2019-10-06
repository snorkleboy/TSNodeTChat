"use strict";
exports.__esModule = true;
var recordStore_1 = require("../recordStore");
var store_1 = require("../store");
var userId = 0;
var getNewUserId = function () { return userId++; };
var User = /** @class */ (function () {
    function User(id, username, socket) {
        var _this = this;
        this.id = id;
        this.username = username;
        this.channels = new recordStore_1.ChannelStore();
        this.sockets = new recordStore_1.RecordStore();
        this.forEachSocket = function (cb) { return _this.sockets.forEach(function (s) { return cb(s); }); };
        this.writeToAllSockets = function (m) { return _this.sockets.forEach(function (s) { return s.write(m); }); };
        this.addSocket = function (socket) { return _this.sockets.add(socket); };
        this.removeSocket = function (socket) { return _this.sockets.remove(socket); };
        this.addChannel = function (channel) {
            _this.channels.add(channel);
            channel.users.add(_this);
            return _this;
        };
        this.addSocket(socket);
    }
    ;
    User.getUser = function (id) { return store_1.Store.getStore().users.get(id); };
    User.addUser = function (user) { return store_1.Store.getStore().users.add(user); };
    User.createUser = function (name, socket) { return new User(getNewUserId(), name, socket); };
    User.forEachUser = function () { return store_1.Store.getStore().users.forEach; };
    return User;
}());
exports.User = User;
