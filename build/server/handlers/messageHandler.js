"use strict";
exports.__esModule = true;
var handlersMap_1 = require("./handlersMap");
exports.messageHandler = function (message, store, user) {
    console.log("reveived message", user.username, message);
    try {
        return handlersMap_1.messageActionHandlerResolver[message.type][message.action](message, store, user);
        ;
    }
    catch (error) {
        console.error({ error: error, message: message });
    }
};
