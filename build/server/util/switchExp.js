"use strict";
exports.__esModule = true;
var isFunction = function (thing) { return typeof thing === 'function'; };
exports.when = function (condition, value) { return [condition, value]; };
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
    return ret;
};
var testWhen = function (when, value) {
    var ret = undefined;
    var conditionMet = isFunction(when[0]) ?
        when[0](value) :
        when[0] === value;
    if (conditionMet) {
        ret = getWhenValue(when);
    }
    return { value: ret, conditionMet: conditionMet };
};
var getWhenValue = function (when) { return isFunction(when[1]) ?
    when[1]() :
    when[1]; };
