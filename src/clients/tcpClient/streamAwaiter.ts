import { HandledResponses, UserPostResponse } from "../../lib/messages/messages";
import { MessageLike } from "../../lib/messages/message";

export type StreamChecker<res> = (r: res) => boolean
type CheckerStore = { [key: number]: { timeoutTime: number, setTime: number, checker: StreamChecker<MessageLike>, resolve: Function, rej: Function } };


export class StreamAwaiter{
    checkers: CheckerStore = {

    }
    i=0
    waitFor = <Res extends MessageLike>(checker: StreamChecker<Res>, timeoutTime: number = undefined): Promise<Res> => new Promise(
        (resolve, rej) => {
            this.checkers[this.i++] = { checker, resolve, rej, setTime: Date.now(), timeoutTime };
        }
    )
    onData = (parsed: HandledResponses | UserPostResponse) => {
        const checkerArr = Object.entries(this.checkers);
        if (checkerArr.length > 0) {
            checkerArr.forEach(([key, checkerWrapper]) => {
                if (checkerWrapper.checker(parsed)) {
                    delete this.checkers[key];
                    checkerWrapper.resolve(parsed);
                } else {
                    if (checkerWrapper.timeoutTime && Date.now() - checkerWrapper.setTime > checkerWrapper.timeoutTime) {
                        checkerWrapper.rej("timeout");
                    }
                }
            })
        }
    }

}
    