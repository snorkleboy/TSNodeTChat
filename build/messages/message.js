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
var Response = /** @class */ (function () {
    function Response(req) {
        this.isResponse = true;
        this.type = req.type;
    }
    return Response;
}());
exports.Response = Response;
