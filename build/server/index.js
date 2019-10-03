"use strict";
exports.__esModule = true;
var server_1 = require("./server");
var socketHandler_1 = require("./handlers/socketHandler");
var store_1 = require("./store/store");
var tcpSockets = store_1.Store.createStore();
var _a = server_1.TCPHTTPSwitchServer(function (socket) { return socketHandler_1.socketHandler(socket, tcpSockets); }), tcpServer = _a.tcpServer, httpServer = _a.httpServer;
tcpServer.on("error", function (e) { return console.error("tcp server", { e: e }); });
process.openStdin().on('data', function (keyBoardLine) { return tcpSockets.forEachSocket(function (socket) { return socket.write(keyBoardLine); }); });
