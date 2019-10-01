"use strict";
exports.__esModule = true;
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
exports.peekIsHttp = function (socket) {
    var buffer = Buffer.alloc(1000);
    var ret = peek(socket._handle.fd, 1000, buffer);
    var httpBool = false;
    if (ret > 0) {
        var msg = buffer.slice(0, ret).toString('utf8');
        httpBool = isHttp(msg);
    }
    return httpBool;
};
