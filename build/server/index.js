"use strict";
exports.__esModule = true;
var server_1 = require("./server");
var socketHandler_1 = require("./handlers/socketHandler/socketHandler");
var store_1 = require("./store/store");
var options = {
    port: 3005
};
var tcpSockets = store_1.Store.getStore();
var serverWrappers = server_1.TCPHTTPSwitchServer(function (socket) { return socketHandler_1.TCPClientSocketHandler(socket, tcpSockets); }, function (req, res) { return res.end("hello httpServer"); }, options);
serverWrappers.tcpServer.on("error", function (e) { return console.error("tcp server", { e: e }); });
serverWrappers.listen(options, function () { return console.log("listenting on " + options.port); });
process.openStdin().on('data', function (keyBoardLine) { return tcpSockets.forEachSocket(function (socket) { return socket.write(keyBoardLine); }); });
