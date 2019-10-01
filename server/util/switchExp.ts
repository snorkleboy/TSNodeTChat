const isFunction = (thing) => typeof thing === 'function'
const defStr = "default";

type When = [any,any];
export const when = (condition,value):When=>[condition,value]
export const def = (_def):When => [defStr, _def];
export const match = (thing: any, ...whens: Array<When>):any => {
    const value = isFunction(thing) ?
        thing() 
    :
        thing
    ;
    let ret = undefined;
    let activated = false;
    for (let i = 0; i < whens.length; i++) {
        const { value:whenValue, conditionMet} = testWhen(whens[i], value);
        if (conditionMet) {
            ret = whenValue;
            activated = true;
            break;
        }
    }
    if (!activated){
        let possibleDef = whens[whens.length - 1];
        if (possibleDef[0] === defStr){
            ret = isFunction(possibleDef[1]) ? possibleDef[1]() : possibleDef[1];
        }
    }
    return ret;


}
const testWhen = (when, value) => {
    let ret = undefined;
    if (when[0] !== defStr){
        return { conditionMet: false, ret}
    }
    let conditionMet = isFunction(when[0]) ?
        when[0](value) :
        when[0] === value;
    if (conditionMet) {
        ret = getWhenValue(when);
    }
    return { value: ret, conditionMet};
}
const getWhenValue = (when) => isFunction(when[1]) ?
    when[1]() :
    when[1];