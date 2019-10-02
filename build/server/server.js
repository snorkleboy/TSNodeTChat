"use strict";
exports.__esModule = true;
var http_1 = require("http");
var peakIsHttp_1 = require("./util/peakIsHttp");
var Net = require('net');
var port = 3005;
exports.TCPHTTPSwitchServer = function (tcpSocketHandler, options, httpRequestHandler) {
    if (httpRequestHandler === void 0) { httpRequestHandler = (function (req, res) { return res.end("hello httpServer"); }); }
    console.log("server start");
    var tcpServer = new Net.Server();
    var httpServer = http_1.createServer(options, httpRequestHandler);
    tcpServer.listen(port, function () { return console.log("Server listening for connection requests on socket localhost:" + port); });
    tcpServer.on('connection', function (socket) {
        var httpBool = peakIsHttp_1.peekIsHttp(socket);
        console.log({ fd: socket._handle.fd, httpBool: httpBool });
        if (httpBool) {
            httpServer.emit("connection", socket);
        }
        else {
            tcpSocketHandler(socket);
        }
    });
    return { tcpServer: tcpServer, httpServer: httpServer };
};
