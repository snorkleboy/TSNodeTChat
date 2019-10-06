import { Socket } from "net";
import {getNextMessage} from "./getNextMessage";
var peek = require('socket-peek');


const isHttp = (str: string) => {
    if (!str) {
        return false;
    }
    const newLine = str.indexOf("\n") || 100;
    const split = str.slice(0, newLine);
    if (split.toLocaleLowerCase().includes("http")) {
        return true;
    } else {
        return false;
    }
}

//not really a peek anymore, peek library wasnt working
export const peekIsHttp = async (socket: Socket & { ['_handle']: any }): Promise<{httpBool:boolean,msg}> => {
    let httpBool = false;
    let msg = await getNextMessage(socket,500).catch((e)=>{console.log("peek catch",{e,fd:socket._handle.fd})})
    if(msg){
        let parsed = msg.toString('utf8');
        httpBool = isHttp(parsed);
    }
    return {httpBool,msg}
}
