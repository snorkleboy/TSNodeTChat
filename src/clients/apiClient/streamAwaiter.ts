import { HandledResponses, UserPostResponse } from "../../lib/messages/messages";
import { MessageLike } from "../../lib/messages/message";

export type StreamChecker<res> = (r: res,next) => boolean
type CheckerStore<res> = { [key: number]: { timeoutTime: number, setTime: number, checker: StreamChecker<res>, resolve: Function, rej: Function } };


export class StreamAwaiter<Res>{
    checkers: CheckerStore<Res> = {

    }
    i=0
    waitFor = (checker?: StreamChecker<Res>, timeoutTime: number = undefined): Promise<Res> => {
        let ret;
        if(checker){
            ret = new Promise(
                (resolve, rej) => {
                    this.checkers[this.i++] = { checker, resolve, rej, setTime: Date.now(), timeoutTime };
                }
            );
        }else{
            ret = new Promise(
                (resolve, rej) => {
                    this.checkers[this.i++] = { checker:(m)=>true, resolve, rej, setTime: Date.now(), timeoutTime };
                }
            ); 
        }
        return ret;
    }
    onData = (parsed: Res) => {
        const checkerArr = Object.entries(this.checkers);
        let handledAtleastOnce = false;
        if (checkerArr.length > 0) {
            let cont = true;
            const next = (b:boolean)=>{cont = b};
            checkerArr.forEach(([key, checkerWrapper]) => {
                if(cont){
                    if (checkerWrapper.checker(parsed, next)) {
                        delete this.checkers[key];
                        handledAtleastOnce = true;
                        checkerWrapper.resolve(parsed);
                    } else {
                        if (checkerWrapper.timeoutTime && Date.now() - checkerWrapper.setTime > checkerWrapper.timeoutTime) {
                            checkerWrapper.rej("timeout");
                        }
                    }
                }

            })
        }
        return handledAtleastOnce;
    }

}
    