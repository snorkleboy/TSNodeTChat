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
console.log = function (...args) {
    oldLog(...args);
    myConsole.log(...args);
}
console.error = function (...args) {
    oldErr(...args);
    myConsole.error(...args);
}



const listenOptions = {
    port: 3005
};
const store = Store.getStore();
const serverWrapper = TCPHTTPSwitchServer(
    (socket: RawSocket) => socketHandler(socket, store),
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

