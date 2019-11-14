import { HandledResponses, UserPostResponse } from "../../lib/messages/messages";
import { MessageLike } from "../../lib/messages/message";

export type StreamChecker<res> = (r: res,next) => boolean
type CheckerStore<res> = { [key: number]: { timeoutTime: number, setTime: number, checker: StreamChecker<res>, resolve: Function, rej: Function } };

export class StreamAwaiter<Res>{
    checkers: CheckerStore<Res> = {}
    i=0
    waitFor = (checker?: StreamChecker<Res>, timeoutTime: number = undefined,top=false): Promise<Res> => {
        let ret;
        let key = top ? (Object.keys(this.checkers).sort()[0] as any)-1:this.i++
        if(checker){
            ret = new Promise(
                (resolve, rej) => {
                    this.checkers[key] = { checker, resolve, rej, setTime: Date.now(), timeoutTime };
                }
            );
        }else{
            ret = new Promise(
                (resolve, rej) => {
                    this.checkers[key] = { checker:(m)=>true, resolve, rej, setTime: Date.now(), timeoutTime };
                }
            ); 
        }
        return ret;
    }
    onData = (parsed: Res) => {
        const checkerArr = Object.entries(this.checkers).sort((a:any,b:any)=>a[0]-b[0]);
        let handledAtleastOnce = false;
        if (checkerArr.length > 0) {
            let cont = true;
            const next = (b:boolean)=>{cont = b};
            for(let i =0;i<checkerArr.length;i++){
                const key = checkerArr[i][0];
                const checkerWrapper = checkerArr[i][1];
                const check = checkerWrapper.checker(parsed, next);
                if (check) {
                    delete this.checkers[key];
                    handledAtleastOnce = true;
                    checkerWrapper.resolve(parsed);
                }else if(checkerWrapper.timeoutTime && Date.now() - checkerWrapper.setTime > checkerWrapper.timeoutTime){
                    delete this.checkers[key];
                    checkerWrapper.rej("timeout");
                }
                if(!cont){
                    break;
                }
            }
        }
        return handledAtleastOnce;
    }
}
    