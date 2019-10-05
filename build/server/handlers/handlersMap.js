"use strict";
var _a, _b, _c;
exports.__esModule = true;
var message_1 = require("../../messages/message");
var channel_1 = require("../store/channel/channel");
var newline_1 = require("../../util/newline");
exports.messageActionHandlerResolver = (_a = {},
    _a[message_1.MessageTypes.textMessage] = (_b = {},
        _b[message_1.ActionTypes.post] = function (message, store, user) {
            var _a = message.payload, destination = _a.destination, body = _a.body;
            if (destination.type === message_1.DestinationTypes.singleUser) {
                console.error("not implimented", { message: message });
            }
            else if (destination.type === message_1.DestinationTypes.channel) {
                var channel_2 = user.channels.getByName(destination.val);
                if (channel_2) {
                    channel_2.forEachUser(function (u) { return u.id !== user.id && u.writeToAllSockets("" + newline_1.newLineArt(user.username, channel_2.name) + body); });
                }
                else {
                    console.error("requested message to channel the user is not in", { message: message, user: user });
                }
            }
        },
        _b),
    _a[message_1.MessageTypes.channelCommand] = (_c = {},
        _c[message_1.ActionTypes.post] = function (message, store, user) {
            console.log("hi cc");
            var _a = message.payload, channelName = _a.channelName, switchTo = _a.switchTo;
            if (switchTo) {
                user.channels.forEach(function (channel) { return channel.removeUser(user); });
            }
            var channel = channel_1.Channel.getOrCreateChannel(channelName);
            channel.addUser(user);
            channel.forEachUser(function (u) { return u.writeToAllSockets("new user " + user.username); });
        },
        _c[message_1.ActionTypes.get] = function (message, store, user) {
            user.writeToAllSockets(JSON.stringify(store.channels.store));
        },
        _c),
    _a);
