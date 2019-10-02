"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var switchExp_1 = require("../util/switchExp");
var clientType_1 = require("../util/clientType");
var message_1 = require("../messages/message");
var net = require('net');
var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var prompt = function (question) { return new Promise(function (r) {
    rl.question(question, function (answer) { return r(answer); });
}); };
var Client = /** @class */ (function () {
    function Client(socket) {
        var _this = this;
        this.socket = socket;
        this.publicCommands = {
            "/h": { name: 'help', action: null },
            "/c": { name: 'channels', action: null },
            "/q": { name: "quit", action: function () { return _this.setState({ quit: true }); } }
        };
        this.stdIn = process.openStdin();
        this.state = {
            channel: null,
            name: null,
            clientType: clientType_1.ClientType.tcpClient,
            close: false
        };
        this.setState = function (inState) {
            _this.state = __assign(__assign({}, _this.state), inState);
        };
        this.receiveData = function (chunk) { return console.log(chunk.toString("utf8")); };
        this.start = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.state.close) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.promptReducer()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 2:
                        rl.close();
                        this.socket.destroy();
                        return [2 /*return*/];
                }
            });
        }); };
        this.promptReducer = function () { return switchExp_1.match(_this.state, switchExp_1.when(function (s) { return !s.name; }, function () { return prompt("please Enter Name").then(function (name) { return _this.setState({ name: name }); }); }), switchExp_1.when(function (s) { return !s.channel; }, function () { return prompt("please Enter Desired Channel").then(function (channel) { return _this.setState({ channel: channel }); }); }), switchExp_1.def(function () { return prompt(_this.state.name + " | " + _this.state.channel + " ||=>:").then(function (i) { return _this.inputReducer(i); }); })); };
        this.inputReducer = function (input) { return switchExp_1.match.apply(void 0, __spreadArrays([{ input: input, state: _this.state }], Object.entries(_this.publicCommands)
            .map(function (_a) {
            var name = _a[0], command = _a[1];
            return (switchExp_1.when(function (_a) {
                var input = _a.input;
                return input === name;
            }, function () { return command.action(); }));
        }), [switchExp_1.def(function (_a) {
                var input = _a.input;
                return _this.writeToServer(_this.createTextMessage(input));
            })])); };
        this.writeToServer = function (msg) {
            var txt = JSON.stringify(msg);
            console.log({ txt: txt, msg: msg });
            _this.socket.write(txt);
            return false;
        };
        this.createTextMessage = function (msg) { return ({
            payload: msg,
            type: message_1.MessageTypes.textMessage,
            action: message_1.ActionTypes.post
        }); };
        this.publicCommands["/h"].action = function () { return console.log(Object.entries(_this.publicCommands).map(function (_a) {
            var command = _a[0], entry = _a[1];
            return command + "-" + entry;
        })); };
        this.socket.on("data", function (chunk) { return _this.receiveData(chunk); });
    }
    ;
    return Client;
}());
exports.startClient = function (port, address) {
    var clientSocket = new net.Socket();
    clientSocket.connect(port, address, function () {
        console.log('Connected');
        var client = new Client(clientSocket).start();
    });
    clientSocket.on('close', function () {
        console.log('Connection closed');
    });
};
