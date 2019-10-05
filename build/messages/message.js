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
var Response = /** @class */ (function () {
    function Response(req) {
        this.isResponse = true;
        this.type = req.type;
    }
    return Response;
}());
var UserPostRequest = /** @class */ (function () {
    function UserPostRequest(payload) {
        this.payload = payload;
        this.type = MessageTypes.login;
        this.action = ActionTypes.post;
    }
    return UserPostRequest;
}());
exports.UserPostRequest = UserPostRequest;
var TextMessagePostRequest = /** @class */ (function () {
    function TextMessagePostRequest(payload) {
        this.payload = payload;
        this.type = MessageTypes.textMessage;
        this.action = ActionTypes.post;
    }
    return TextMessagePostRequest;
}());
exports.TextMessagePostRequest = TextMessagePostRequest;
var TextMessagePostResponse = /** @class */ (function (_super) {
    __extends(TextMessagePostResponse, _super);
    function TextMessagePostResponse(req, payload) {
        var _this = _super.call(this, req) || this;
        _this.payload = payload;
        return _this;
    }
    return TextMessagePostResponse;
}(Response));
exports.TextMessagePostResponse = TextMessagePostResponse;
var ChannelPostRequest = /** @class */ (function () {
    function ChannelPostRequest(payload) {
        this.payload = payload;
        this.type = MessageTypes.channelCommand;
        this.action = ActionTypes.post;
    }
    return ChannelPostRequest;
}());
exports.ChannelPostRequest = ChannelPostRequest;
var ChannelPostResponse = /** @class */ (function (_super) {
    __extends(ChannelPostResponse, _super);
    function ChannelPostResponse(msg, payload) {
        var _this = _super.call(this, msg) || this;
        _this.payload = payload;
        _this.type = MessageTypes.channelCommand;
        _this.action = ActionTypes.post;
        return _this;
    }
    return ChannelPostResponse;
}(Response));
exports.ChannelPostResponse = ChannelPostResponse;
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
