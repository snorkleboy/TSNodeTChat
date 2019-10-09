import { HandledResponses, UserPostResponse } from "../../lib/messages/messages";

export type StreamChecker<res> = (r: res) => boolean
let i = 0;
export const StreamAwaiter = () => {
    type CheckerStore = { [key: number]: { timeoutTime: number, setTime: number, checker: StreamChecker<HandledResponses | UserPostResponse>, resolve: Function, rej: Function } };
    const checkers: CheckerStore = {

    }
    return ({
        waitFor: <Res extends HandledResponses | UserPostResponse>(checker: StreamChecker<Res>, timeoutTime: number = 1000): Promise<Res> => new Promise((resolve, rej) => {
            checkers[i++] = { checker, resolve, rej, setTime: Date.now(), timeoutTime };
        }),
        onData: (parsed:HandledResponses|UserPostResponse) => {
            const checkerArr = Object.entries(checkers);
            if (checkerArr.length > 0) {
                checkerArr.forEach(([key, checkerWrapper]) => {
                    if (checkerWrapper.checker(parsed)) {
                        delete checkers[key];
                        checkerWrapper.resolve(parsed);
                    } else {
                        if (checkerWrapper.timeoutTime && Date.now() - checkerWrapper.setTime > checkerWrapper.timeoutTime) {
                            checkerWrapper.rej("timeout");
                        }
                    }
                })
            }
        }

    })
}
    