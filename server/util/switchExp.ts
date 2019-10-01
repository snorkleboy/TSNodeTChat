const isFunction = (thing) => typeof thing === 'function'

export const when = (condition,value)=>[condition,value]
export const match = (thing:any, ...whens:Array<Array<any>>) => {
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
    return ret;


}
const testWhen = (when, value) => {
    let ret = undefined;

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