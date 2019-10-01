"use strict";
exports.__esModule = true;
var sockets_1 = require("./sockets/sockets");
var socketHandler_1 = require("./sockets/socketHandler");
var http_1 = require("http");
var Net = require('net');
var peek = require('socket-peek');
var isHttp = function (str) {
    if (!str) {
        return false;
    }
    var newLine = str.indexOf("\n") || 100;
    var split = str.slice(0, newLine).split("/");
    if (!split[1]) {
        return false;
    }
    if (split[1].toLocaleLowerCase().includes("http")) {
        return true;
    }
    else {
        return false;
    }
};
var peekIsHttp = function (socket) {
    var buffer = Buffer.alloc(1000);
    var ret = peek(socket._handle.fd, 1000, buffer);
    var msg;
    var httpBool = false;
    if (ret > 0) {
        msg = buffer.slice(0, ret).toString('utf8');
        httpBool = isHttp(msg);
    }
    else {
        msg = "no message";
    }
    return httpBool;
};
var port = 3005;
exports.startServer = function (options) {
    if (options === void 0) { options = {}; }
    console.log("server start");
    var sockets = new sockets_1.Sockets();
    process.openStdin()
        .on('data', function (keyBoardLine) { return sockets.forEachSocket(function (socket) { return socket.write(keyBoardLine); }); });
    var server = new Net.Server();
    var httpServer = http_1.createServer(function (req, res) { return res.end("hello httpServer"); });
    server.listen(port, function () { return console.log("Server listening for connection requests on socket localhost:" + port); });
    server.on('connection', function (socket) {
        var httpBool = peekIsHttp(socket);
        console.log({ fd: socket._handle.fd, httpBool: httpBool });
        if (httpBool) {
            httpServer.emit("connection", socket);
        }
        else {
            socketHandler_1.socketHandler(socket, sockets);
        }
    });
    server.on("error", function (e) { return console.error({ e: e }); });
};
