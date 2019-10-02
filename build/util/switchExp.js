"use strict";
exports.__esModule = true;
var defStr = "default";
exports.when = function (condition, value) { return [condition, value]; };
exports.def = function (_def) { return [defStr, _def]; };
exports.match = function (testThing) {
    var whens = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        whens[_i - 1] = arguments[_i];
    }
    var value = getFromFunctionOrValue(testThing);
    var _a = testWhens(whens, value), whensValue = _a.whensValue, activated = _a.activated;
    if (!activated) {
        whensValue = checkDefault(whens, value);
    }
    return whensValue;
};
var testWhens = function (whens, value) {
    var whensValue = undefined;
    var activated = false;
    for (var i = 0; i < whens.length; i++) {
        var _a = testWhen(whens[i], value), whenValue = _a.value, conditionMet = _a.conditionMet;
        if (conditionMet) {
            whensValue = whenValue;
            activated = true;
            break;
        }
    }
    return { whensValue: whensValue, activated: activated };
};
var testWhen = function (when, value) {
    var ret = undefined;
    var conditionMet = undefined;
    if (when[0] === defStr) {
        conditionMet = false;
    }
    else {
        conditionMet = checkWhenCondition(when, value);
        if (conditionMet) {
            ret = getWhenValue(when, value);
        }
    }
    return { value: ret, conditionMet: conditionMet };
};
var checkDefault = function (whens, value) {
    var possibleDefWhen = whens[whens.length - 1];
    if (possibleDefWhen[0] === defStr) {
        return getWhenValue(possibleDefWhen, value);
    }
};
var checkWhenCondition = function (when, value) { return isFunction(when[0]) ?
    when[0](value)
    :
        when[0] === value; };
var getWhenValue = function (when, value) { return getFromFunctionOrValue(when[1], true, value); };
var getFromFunctionOrValue = function (funcOrValue, shouldPassVal, invocationVal) {
    if (shouldPassVal === void 0) { shouldPassVal = false; }
    if (invocationVal === void 0) { invocationVal = undefined; }
    return isFunction(funcOrValue) ?
        (shouldPassVal ? funcOrValue(invocationVal) : funcOrValue())
        :
            funcOrValue;
};
var isFunction = function (thing) { return typeof thing === 'function'; };
