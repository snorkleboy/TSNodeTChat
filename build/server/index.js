"use strict";
exports.__esModule = true;
var server_1 = require("./server");
var _a = server_1.startServer(), tcpServer = _a.tcpServer, httpServer = _a.httpServer;
tcpServer.on("error", function (e) { return console.error("tcp server", { e: e }); });
