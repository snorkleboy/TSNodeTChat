"use strict";
exports.__esModule = true;
var i = 0;
exports.StreamAwaiter = function () {
    var checkers = {};
    return ({
        waitFor: function (checker, timeoutTime) {
            if (timeoutTime === void 0) { timeoutTime = 1000; }
            return new Promise(function (resolve, rej) {
                checkers[i++] = { checker: checker, resolve: resolve, rej: rej, setTime: Date.now(), timeoutTime: timeoutTime };
            });
        },
        onData: function (msg) {
            var checkerArr = Object.entries(checkers);
            if (checkerArr.length > 0) {
                try {
                    var parsed_1 = JSON.parse(msg);
                    checkerArr.forEach(function (_a) {
                        var key = _a[0], checkerWrapper = _a[1];
                        if (checkerWrapper.checker(parsed_1)) {
                            delete checkers[key];
                            checkerWrapper.resolve(parsed_1);
                        }
                        else {
                            if (Date.now() - checkerWrapper.setTime > checkerWrapper.timeoutTime) {
                                checkerWrapper.rej("timeout");
                            }
                        }
                    });
                }
                catch (error) {
                    console.error("StreamAwaiter couldnt parse as json", { msg: msg });
                }
            }
        }
    });
};
