"use strict";
exports.__esModule = true;
var net = require('net');
exports.startClient = function () {
    var client = new net.Socket();
    client.connect(3005, '127.0.0.1', function () {
        console.log('Connected');
    });
    process.openStdin()
        .on('data', function (keyBoardLine) { return client.write(keyBoardLine); });
    client.on('data', function (data) {
        console.log(data.toString('utf8'));
    });
    client.on('close', function () {
        console.log('Connection closed');
    });
};
exports.startClient();
