"use strict";
exports.__esModule = true;
var switchExp_1 = require("../../util/switchExp");
var message_1 = require("../../messages/message");
exports.messageHandler = function (message, sockets) { return switchExp_1.match(message.type, switchExp_1.when(message_1.MessageTypes.channelCommand, function () { console.log("hi"); return "channel"; }), switchExp_1.when(message_1.MessageTypes.textMessage, function () { console.log("hi"); return "text"; }), switchExp_1.def("unmatched")); };
