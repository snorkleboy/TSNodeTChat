import { TCPHTTPSwitchServer} from "./server";
import { Store } from "../lib/store/store";
import { socketHandler} from "./handlers/socketHandler";
import { TextMessagePostRequest, TextMessagePostResponse } from "../lib/messages/messages";
import { DestinationTypes } from "../lib/messages/message";
import { httpApp } from "./httpApp";
import { User } from "../lib/store/user/user";
import { Socket as tcpsocket } from "net";
import { TCPSocketWrapper, RawSocket } from "../lib/store/sockets/socket";
import * as fs from 'fs';


const myLogFileStream = fs.createWriteStream("./logs/server.log");
const myConsole = new console.Console(myLogFileStream, myLogFileStream);
const oldLog = console.log;
const oldErr = console.error;
const dayMs = 1000 * 60 * 60 * 24
const getDateStamp = ()=>{
    const date = Date.now();
    const days = parseInt((date / dayMs) as any);
    const leftOver = (date % dayMs);
    const s = parseInt((leftOver % 60000)/1000 as any);
    const min = parseInt((leftOver/60000) as any);
    return `${days}:${min}:${s} -`
}
console.log = function (...args) {
    const timeStampedArgs = [getDateStamp(),...args];
    oldLog(...args);
    myConsole.log(...timeStampedArgs);
}
console.error = function (...args) {
    const timeStampedArgs = [getDateStamp(), ...args];
    oldErr(...args);
    myConsole.error(...timeStampedArgs);
}
console.log("timeStamp format = Days:minutes:seconds")


const listenOptions = {
    port: 3005
};
const store = Store.getStore();
const serverWrapper = TCPHTTPSwitchServer(
    socketHandler,
    httpApp,
);
serverWrapper.listen(listenOptions, () => console.log(`listenting on ${listenOptions.port}`));
process.openStdin().on(
    'data',
    keyBoardLine => store.forEachSocket(socket => socket.write(new TextMessagePostResponse(
            new TextMessagePostRequest(keyBoardLine,"all")
            ,User.serverUser
        )
    ))
);

