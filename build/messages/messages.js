"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var message_1 = require("./message");
var UserPostRequest = /** @class */ (function () {
    function UserPostRequest(payload) {
        this.payload = payload;
        this.type = message_1.MessageTypes.login;
        this.action = message_1.ActionTypes.post;
    }
    return UserPostRequest;
}());
exports.UserPostRequest = UserPostRequest;
var UserPostResponse = /** @class */ (function (_super) {
    __extends(UserPostResponse, _super);
    function UserPostResponse(msg, user, payload) {
        if (payload === void 0) { payload = {
            userName: msg.payload.userName,
            channels: user.channels.getList().map(function (_a) {
                var name = _a.name, id = _a.id;
                return ({ name: name, id: id });
            })
        }; }
        var _this = _super.call(this, msg) || this;
        _this.payload = payload;
        return _this;
    }
    return UserPostResponse;
}(message_1.Response));
exports.UserPostResponse = UserPostResponse;
var TextMessagePostRequest = /** @class */ (function () {
    function TextMessagePostRequest(payload) {
        this.payload = payload;
        this.type = message_1.MessageTypes.textMessage;
        this.action = message_1.ActionTypes.post;
    }
    return TextMessagePostRequest;
}());
exports.TextMessagePostRequest = TextMessagePostRequest;
var TextMessagePostResponse = /** @class */ (function (_super) {
    __extends(TextMessagePostResponse, _super);
    function TextMessagePostResponse(req, user, payload) {
        if (payload === void 0) { payload = {
            body: req.payload.body,
            from: {
                name: user.username,
                id: user.id
            }
        }; }
        var _this = _super.call(this, req) || this;
        _this.payload = payload;
        return _this;
    }
    return TextMessagePostResponse;
}(message_1.Response));
exports.TextMessagePostResponse = TextMessagePostResponse;
var ChannelPostRequest = /** @class */ (function () {
    function ChannelPostRequest(payload) {
        this.payload = payload;
        this.type = message_1.MessageTypes.channelCommand;
        this.action = message_1.ActionTypes.post;
    }
    return ChannelPostRequest;
}());
exports.ChannelPostRequest = ChannelPostRequest;
var ChannelPostResponse = /** @class */ (function (_super) {
    __extends(ChannelPostResponse, _super);
    function ChannelPostResponse(msg, user, payload) {
        if (payload === void 0) { payload = {
            channelName: msg.payload.channelName,
            userThatJoined: user.username
        }; }
        var _this = _super.call(this, msg) || this;
        _this.payload = payload;
        _this.type = message_1.MessageTypes.channelCommand;
        _this.action = message_1.ActionTypes.post;
        return _this;
    }
    return ChannelPostResponse;
}(message_1.Response));
exports.ChannelPostResponse = ChannelPostResponse;
var ChannelGetRequest = /** @class */ (function () {
    function ChannelGetRequest(payload) {
        if (payload === void 0) { payload = undefined; }
        this.payload = payload;
        this.type = message_1.MessageTypes.channelCommand;
        this.action = message_1.ActionTypes.get;
    }
    return ChannelGetRequest;
}());
exports.ChannelGetRequest = ChannelGetRequest;
