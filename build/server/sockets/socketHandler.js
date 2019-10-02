"use strict";
exports.__esModule = true;
var messageHandler_1 = require("../messageHandler/messageHandler");
function socketConfigurer(thisId, socket, socketStore, messageHandler) {
    socket.setEncoding('utf8');
    socketStore.addSocket(thisId, socket);
    socket.on('data', function (receivedDataChunk) {
        try {
            var data = receivedDataChunk.toString('utf8');
            console.log({ data: data });
            var parsed = JSON.parse(data);
            messageHandler(parsed, socketStore);
        }
        catch (error) {
            console.error({ error: error, receivedDataChunk: receivedDataChunk });
        }
    });
    socket.on('end', function () {
        console.log('Closing connection with the client');
        socketStore.removeSocket(thisId);
    });
    socket.on('error', function (err) { return console.log("Error: " + err); });
}
var currId = 0;
exports.socketHandler = function (socket, socketStore, messageHandler) {
    if (messageHandler === void 0) { messageHandler = messageHandler_1.messageHandler; }
    return socketConfigurer(currId++, socket, socketStore, messageHandler);
};
