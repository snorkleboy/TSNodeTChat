"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var RecordStore = /** @class */ (function () {
    function RecordStore(store) {
        var _this = this;
        if (store === void 0) { store = {}; }
        this.store = store;
        this.forEach = function (cb) { return Object.entries(_this.store).forEach(function (_a) {
            var id = _a[0], object = _a[1];
            return cb(object, id);
        }); };
        this.add = function (object) { _this.store[object.id] = object; return object; };
        this.remove = function (object) { delete _this.store[object.id]; return object; };
        this.removeById = function (id) { return delete _this.store[id]; };
        this.get = function (id) { return _this.store[id]; };
        this.store = store;
    }
    return RecordStore;
}());
exports.RecordStore = RecordStore;
var UserStore = /** @class */ (function (_super) {
    __extends(UserStore, _super);
    function UserStore() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UserStore;
}(RecordStore));
exports.UserStore = UserStore;
var ChannelStore = /** @class */ (function (_super) {
    __extends(ChannelStore, _super);
    function ChannelStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.nameStore = {};
        _this.add = function (channel) {
            _this.store[channel.id] = channel;
            _this.nameStore[channel.name] = channel;
            return channel;
        };
        _this.getByName = function (name) {
            return _this.nameStore[name];
        };
        _this.getList = function () { return Object.values(_this.store); };
        return _this;
    }
    return ChannelStore;
}(RecordStore));
exports.ChannelStore = ChannelStore;
// this.dynamicName = name;
// this[`forEach${capitlizedName}`] = (cb: (T, number) => {}) => Object.entries(store).forEach(([id, object]) => cb(object, id));
// this[`add${capitlizedName}`] = (object: T) => store[object.id] = object;
// this[`remove${capitlizedName}`] = (object: T) => delete store[object.id]
