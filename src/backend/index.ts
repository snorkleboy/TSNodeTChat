import { TCPHTTPSwitchServer} from "./server";
import { Store } from "../lib/store/store";
import { socketHandler} from "./handlers/socketHandler";
import { TextMessagePostRequest, TextMessagePostResponse } from "../lib/messages/messages";
import { DestinationTypes } from "../lib/messages/message";
import { httpApp } from "./httpApp";
import { User } from "../lib/store/user/user";
import { Socket as tcpsocket } from "net";
import { TCPSocketWrapper, RawSocket } from "../lib/store/sockets/socket";
import setupLogger from "./util/logger"
const env = process.env.enviroment || 'development';
const config = require(`./config/config.${env}.js`).default

setupLogger();
console.log({env,config});


const listenOptions = {
    port: config.port
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

