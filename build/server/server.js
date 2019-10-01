"use strict";
exports.__esModule = true;
var sockets_1 = require("./sockets/sockets");
var socketHandler_1 = require("./sockets/socketHandler");
var http_1 = require("http");
var peakIsHttp_1 = require("./util/peakIsHttp");
var Net = require('net');
var port = 3005;
exports.startServer = function (options, httpHandler) {
    console.log("server start");
    var tcpSockets = new sockets_1.Sockets();
    process.openStdin()
        .on('data', function (keyBoardLine) { return tcpSockets.forEachSocket(function (socket) { return socket.write(keyBoardLine); }); });
    var tcpServer = new Net.Server();
    var httpServer = http_1.createServer(options, httpHandler || (function (req, res) { return res.end("hello httpServer"); }));
    tcpServer.listen(port, function () { return console.log("Server listening for connection requests on socket localhost:" + port); });
    tcpServer.on('connection', function (socket) { return TCPHTTPSwitch(socket, tcpSockets, httpServer); });
    return { tcpServer: tcpServer, httpServer: httpServer };
};
var TCPHTTPSwitch = function (socket, tcpSockets, httpServer) {
    var httpBool = peakIsHttp_1.peekIsHttp(socket);
    console.log({ fd: socket._handle.fd, httpBool: httpBool });
    if (httpBool) {
        httpServer.emit("connection", socket);
    }
    else {
        socketHandler_1.socketHandler(socket, tcpSockets);
    }
};
