"use strict";
exports.__esModule = true;
var http_1 = require("http");
var peakIsHttp_1 = require("./util/peakIsHttp");
var Net = require('net');
var port = 3005;
exports.TCPHTTPSwitchServer = function (onConnectNonHTTPTCPSocket, httpRequestHandler, options) {
    console.log("server start");
    var tcpServer = new Net.Server();
    var httpServer = http_1.createServer(httpRequestHandler);
    tcpServer.on('connection', function (socket) {
        var httpBool = peakIsHttp_1.peekIsHttp(socket);
        console.log({ fd: socket._handle.fd, httpBool: httpBool });
        if (httpBool) {
            httpServer.emit("connection", socket);
        }
        else {
            onConnectNonHTTPTCPSocket(socket);
        }
    });
    return { tcpServer: tcpServer, httpServer: httpServer, listen: function (listenOptions, cb) { return tcpServer.listen(listenOptions, cb); } };
};
