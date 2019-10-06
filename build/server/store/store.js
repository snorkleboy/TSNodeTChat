"use strict";
exports.__esModule = true;
var recordStore_1 = require("./recordStore");
var Store = /** @class */ (function () {
    function Store() {
        var _this = this;
        this.channels = new recordStore_1.ChannelStore({ 0: Store.defaultChannel });
        this.users = new recordStore_1.UserStore();
        this.forEachSocket = function (cb) { return _this.users.forEach(function (user) { return user.forEachSocket(function (socket) { return cb(socket, user); }); }); };
    }
    ;
    Store.getStore = function () {
        if (!Store.Store) {
            Store.Store = new Store();
        }
        return Store.Store;
    };
    return Store;
}());
exports.Store = Store;
