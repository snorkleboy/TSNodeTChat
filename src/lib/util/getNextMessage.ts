import { WrappedSocket } from "../../lib/store/sockets/socket";


export const getNextMessage = <T extends { once: Function }>(socket:T ,timeout = null) => new Promise<any>((r, e) => {
    let timedOut = false;
    let finished = false;
    socket.once("data", (chunk) => {
        if(!timedOut){
            finished = true;
            r(chunk);
        }
    })
    const errorCB = (err)=>{
        if (!timedOut){
            finished = true;
            e(err);
        }
    }
    socket.once('end', errorCB );
    socket.once('error', errorCB);
    if(timeout){
        setTimeout(()=>{
            if(!finished){
                timedOut = true;
                e("timeout");
            }
        },timeout)
    }
});