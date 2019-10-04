"use strict";
exports.__esModule = true;
var typeActionMap_1 = require("./typeActionMap");
exports.messageHandler = function (message, store, user) {
    console.log("reveived message", user.username, message);
    try {
        return typeActionMap_1.messageActionHandlerResolver[message.type][message.action](message, store, user);
        ;
    }
    catch (error) {
        console.error({ error: error, message: message });
    }
};
