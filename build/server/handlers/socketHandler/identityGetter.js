"use strict";
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
exports.__esModule = true;
var store_1 = require("../../store/store");
var user_1 = require("../../store/user/user");
var messages_1 = require("../../../messages/messages");
var message_1 = require("../../../messages/message");
var getNextMessage = function (socket) { return new Promise(function (r, e) {
    socket.once("data", function (chunk) { return r(chunk); });
    socket.once('end', e);
    socket.once('error', e);
}); };
//at this point the socket is confired not HTTP, but it may be a full json client or a 'barecleint' like telnet or netcat. 
function IdentityGetter(socket, store) {
    return __awaiter(this, void 0, void 0, function () {
        var endCB, errorCB, err, startTime, user, isJson, chunk;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    endCB = function () {
                        console.log('Closing connection with the client before Identity');
                    };
                    errorCB = function (err) { return console.log("Error before identity: " + err); };
                    socket.socket.on('end', endCB);
                    socket.socket.on('error', errorCB);
                    startTime = Date.now();
                    console.log("IdentityGetter try");
                    _b.label = 1;
                case 1:
                    if (!(!user && !err)) return [3 /*break*/, 3];
                    return [4 /*yield*/, getNextMessage(socket.socket)["catch"](function (e) {
                            err = true;
                            console.error("error getting identity message", e);
                        })];
                case 2:
                    chunk = _b.sent();
                    if (chunk) {
                        (_a = handleIdentityChunk(chunk, socket), user = _a.user, isJson = _a.isJson);
                    }
                    return [3 /*break*/, 1];
                case 3:
                    socket.socket.removeListener('end', endCB);
                    socket.socket.removeListener('error', errorCB);
                    return [2 /*return*/, {
                            user: user,
                            isJson: isJson
                        }];
            }
        });
    });
}
exports.IdentityGetter = IdentityGetter;
var handleIdentityChunk = function (chunk, socket) {
    //if json, try parse as login message or try again, else interpret non-json as user name;
    var parsed;
    var userInfo;
    var user;
    var isJson;
    try {
        parsed = JSON.parse(chunk);
        //if initial message is not json then it is interpreted as a name
    }
    catch (error) {
        userInfo = chunk.toString("utf8");
        if (userInfo && userInfo.length > 0) {
            user = user_1.User.createUser(userInfo, socket);
            isJson = false;
        }
        else {
            // try again
        }
    }
    if (parsed && parsed.type && parsed.type === message_1.MessageTypes.login && parsed.action === message_1.ActionTypes.post && parsed.payload && parsed.payload.userName) {
        userInfo = parsed.payload.userName;
        isJson = true;
        user = user_1.User.createUser(userInfo, socket)
            .addChannel(store_1.Store.defaultChannel);
        socket.write(JSON.stringify(new messages_1.UserPostResponse(parsed, user)));
    }
    else {
        //try again;
    }
    return {
        user: user,
        isJson: isJson
    };
};
