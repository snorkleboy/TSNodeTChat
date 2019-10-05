"use strict";
exports.__esModule = true;
var currId = 0;
var getNewSocketId = function () { return currId++; };
var SocketWrapper = /** @class */ (function () {
    function SocketWrapper(socket, id) {
        var _this = this;
        this.socket = socket;
        this.id = id;
        this.write = function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = _this.socket).write.apply(_a, args);
        };
    }
    ;
    SocketWrapper.createSocketWrapper = function (socket) { return new SocketWrapper(socket, getNewSocketId()); };
    return SocketWrapper;
}());
exports.SocketWrapper = SocketWrapper;
