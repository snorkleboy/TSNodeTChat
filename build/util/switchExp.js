"use strict";
exports.__esModule = true;
var isFunction = function (thing) { return typeof thing === 'function'; };
var defStr = "default";
exports.when = function (condition, value) { return [condition, value]; };
exports.def = function (_def) { return [defStr, _def]; };
exports.match = function (thing) {
    var whens = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        whens[_i - 1] = arguments[_i];
    }
    var value = isFunction(thing) ?
        thing()
        :
            thing;
    var ret = undefined;
    var activated = false;
    for (var i = 0; i < whens.length; i++) {
        var _a = testWhen(whens[i], value), whenValue = _a.value, conditionMet = _a.conditionMet;
        if (conditionMet) {
            ret = whenValue;
            activated = true;
            break;
        }
    }
    if (!activated) {
        var possibleDef = whens[whens.length - 1];
        if (possibleDef[0] === defStr) {
            ret = getWhenValue(possibleDef, value);
        }
    }
    return ret;
};
var testWhen = function (when, value) {
    var ret = undefined;
    if (when[0] === defStr) {
        return { conditionMet: false, ret: ret };
    }
    var conditionMet = isFunction(when[0]) ?
        when[0](value) :
        when[0] === value;
    if (conditionMet) {
        ret = getWhenValue(when, value);
    }
    return { value: ret, conditionMet: conditionMet };
};
var getWhenValue = function (when, topValue) { return isFunction(when[1]) ?
    when[1](topValue) :
    when[1]; };
