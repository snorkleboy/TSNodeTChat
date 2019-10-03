"use strict";
exports.__esModule = true;
var store_1 = require("./store");
var channelId = 0;
var getNewChannelId = function () { return channelId++; };
var Channel = /** @class */ (function () {
    function Channel(id, name) {
        var _this = this;
        this.id = id;
        this.name = name;
        this.users = new store_1.RecordStore();
        this.forEachUser = function (cb) { return _this.users.forEach(function (user) { return cb(user); }); };
        this.addUser = function (user) {
            _this.users.add(user);
            user.channels.add(_this);
            return user;
        };
        this.removeUser = function (user) { return _this.users.remove(user); };
    }
    ;
    Channel.getChannel = function (id) { return store_1.Store.getStore().channels.get(id); };
    Channel.getChannelByName = function (name) { return store_1.Store.getStore().channels.getByName(name); };
    Channel.addChannel = function (channel) { return store_1.Store.getStore().channels.add(channel); };
    Channel.createChannel = function (name) { return new Channel(getNewChannelId(), name); };
    Channel.getOrCreateChannel = function (name) {
        var channel = Channel.getChannelByName(name);
        if (!channel) {
            channel = Channel.addChannel(Channel.createChannel(name));
        }
        else {
            console.log("got existing channel", { channel: channel });
        }
        return channel;
    };
    Channel.forEachUser = function () { return store_1.Store.getStore().channels.forEach; };
    return Channel;
}());
exports.Channel = Channel;
