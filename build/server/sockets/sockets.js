"use strict";
exports.__esModule = true;
// enum ClientType{
//     noClient = "NOCLIENT",
//     withClient="WITHCLIENT"
// }
// class User{
//     socket:ISocket
//     clientType: ClientType
//     write:Function
// }
var Sockets = /** @class */ (function () {
    function Sockets() {
        var _this = this;
        this.sockets = {};
        this.addSocket = function (id, socket) { return _this.sockets[id] = socket; };
        this.removeSocket = function (id) { return delete _this.sockets[id]; };
        this.forEachSocket = function (cb) { return Object.entries(_this.sockets).forEach(function (_a) {
            var id = _a[0], socket = _a[1];
            return cb(socket, id);
        }); };
    }
    return Sockets;
}());
exports.Sockets = Sockets;
