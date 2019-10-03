
const defStr = "default";
type funcThatTakes<T> = (value: T) => any;
type funkThatReturns<T> = ()=>T

type TOrFuncThatRetunsIt<MatchParam> = funkThatReturns<MatchParam> | MatchParam;
type MatchCaseOrFuncThatRetunsIt<matchValue> = funcThatTakes<matchValue> | any;

type When<matchValue> = [MatchCaseOrFuncThatRetunsIt<matchValue>, MatchCaseOrFuncThatRetunsIt<matchValue>];
type Whens<matchValue> = Array<When<matchValue>>;

export const when = <T>(condition,value):When<T> => [condition,value];
export const  def = <T>(_def):When<T> =>[defStr, _def];


export const match = <T>(testThing: TOrFuncThatRetunsIt<T>, ...whens:Whens<T> ):any => {
    const value = getFromFunctionOrValue(testThing);
    let { whensValue,activated} = testWhens(whens,value);
    if (!activated) {
        whensValue = checkDefault(whens,value);
    }
    return whensValue;
}
const testWhens = <T>(whens: Whens<T>, value): { whensValue: any, activated: boolean } =>{
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
const testWhen =<T> (when:When<T>, value) => {
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
const checkDefault = <T>(whens:Whens<T>,value)=>{
    let possibleDefWhen = whens[whens.length - 1];
    if (possibleDefWhen[0] === defStr) {
        return getWhenValue(possibleDefWhen, value);
    }
}



const checkWhenCondition = <T>(when:When<T>,value) => isFunction(when[0])?
    when[0](value)
    :
    when[0] === value;
const getWhenValue = <T>(when:When<T>,value)=>getFromFunctionOrValue(when[1],true,value);
const getFromFunctionOrValue = (funcOrValue, shouldPassVal = false, invocationVal = undefined) => isFunction(funcOrValue) ?
    (shouldPassVal ? funcOrValue(invocationVal) : funcOrValue())
    :
    funcOrValue
    ;

const isFunction = (thing) => typeof thing === 'function';
