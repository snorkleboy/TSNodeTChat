
const defStr = "default";
type When = [any,any];
type Whens = Array<When>;
export const when = (condition,value):When=>[condition,value]
export const def = (_def):When => [defStr, _def];
export const match = (testThing: any, ...whens:Whens ):any => {
    const value = getFromFunctionOrValue(testThing);
    let { whensValue,activated} = testWhens(whens,value);
    if (!activated) {
        whensValue = checkDefault(whens,value);
    }
    return whensValue;
}
const testWhens = (whens: Whens, value): { whensValue: any, activated: boolean } =>{
    let whensValue = undefined;
    let activated = false;
    for (let i = 0; i < whens.length; i++) {
        const { value: whenValue, conditionMet } = testWhen(whens[i], value);
        if (conditionMet) {
            whensValue = whenValue;
            activated = true;
            break;
        }
    }
    return {whensValue,activated}
}
const testWhen = (when:When, value) => {
    let ret = undefined;
    let conditionMet = undefined;
    if (when[0] === defStr){
        conditionMet= false;
    }else{
        conditionMet = checkWhenCondition(when,value);
        if (conditionMet) {
            ret = getWhenValue(when,value);
        }
    }
    return { value: ret, conditionMet};
}
const checkDefault = (whens:Whens,value)=>{
    let possibleDefWhen = whens[whens.length - 1];
    if (possibleDefWhen[0] === defStr) {
        return getWhenValue(possibleDefWhen, value);
    }
}



const checkWhenCondition = (when:When,value) => isFunction(when[0])?
    when[0](value)
    :
    when[0] === value;
const getWhenValue = (when:When,value)=>getFromFunctionOrValue(when[1],true,value);
const getFromFunctionOrValue = (funcOrValue, shouldPassVal = false, invocationVal = undefined) => isFunction(funcOrValue) ?
    (shouldPassVal ? funcOrValue(invocationVal) : funcOrValue())
    :
    funcOrValue
    ;

const isFunction = (thing) => typeof thing === 'function';
