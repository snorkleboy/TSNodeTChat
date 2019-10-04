"use strict";
exports.__esModule = true;
var ActionTypes;
(function (ActionTypes) {
    ActionTypes["post"] = "POST";
    ActionTypes["patch"] = "PATCH";
    ActionTypes["get"] = "GET";
    ActionTypes["delete"] = "DELETE";
})(ActionTypes = exports.ActionTypes || (exports.ActionTypes = {}));
var MessageTypes;
(function (MessageTypes) {
    MessageTypes["textMessage"] = "TEXT_MESSAGE";
    MessageTypes["channelCommand"] = "CHANNEL_COMMAND";
    MessageTypes["login"] = "LOGIN";
})(MessageTypes = exports.MessageTypes || (exports.MessageTypes = {}));
var DestinationTypes;
(function (DestinationTypes) {
    DestinationTypes["channel"] = "CHANNEL";
    DestinationTypes["singleUser"] = "SINGLEUSER";
})(DestinationTypes = exports.DestinationTypes || (exports.DestinationTypes = {}));
var TextMessagePostRequest = /** @class */ (function () {
    function TextMessagePostRequest(payload) {
        this.payload = payload;
        this.type = MessageTypes.textMessage;
        this.action = ActionTypes.post;
    }
    return TextMessagePostRequest;
}());
exports.TextMessagePostRequest = TextMessagePostRequest;
var UserPostRequest = /** @class */ (function () {
    function UserPostRequest(payload) {
        this.payload = payload;
        this.type = MessageTypes.login;
        this.action = ActionTypes.post;
    }
    return UserPostRequest;
}());
exports.UserPostRequest = UserPostRequest;
var ChannelPostRequest = /** @class */ (function () {
    function ChannelPostRequest(payload) {
        this.payload = payload;
        this.type = MessageTypes.channelCommand;
        this.action = ActionTypes.post;
    }
    return ChannelPostRequest;
}());
exports.ChannelPostRequest = ChannelPostRequest;
var ChannelGetRequest = /** @class */ (function () {
    function ChannelGetRequest(payload) {
        if (payload === void 0) { payload = undefined; }
        this.payload = payload;
        this.type = MessageTypes.channelCommand;
        this.action = ActionTypes.get;
    }
    return ChannelGetRequest;
}());
exports.ChannelGetRequest = ChannelGetRequest;
