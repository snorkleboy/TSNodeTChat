"use strict";
exports.__esModule = true;
var requestHandlersMap_1 = require("./requestHandlersMap");
exports.messageHandler = function (message, store, user) {
    console.log("reveived message", user.username, message);
    try {
        return requestHandlersMap_1.requestTypeActionHandlerMap[message.type][message.action](message, store, user);
        ;
    }
    catch (error) {
        console.error({ error: error, message: message });
    }
};
