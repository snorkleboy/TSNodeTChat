import { TCPHTTPSwitchServer} from "./tcp/server";
import { Store } from "../lib/store/store";
import { socketHandler} from "./handlers/socketHandler";
import { TextMessagePostRequest, TextMessagePostResponse } from "../lib/messages/messages";
import { DestinationTypes } from "../lib/messages/message";
import { httpApp } from "./http/httpApp";
import { User } from "../lib/store/user/user";
import { Socket } from "socket.io";
import { Socket as tcpsocket } from "net";
import { TCPSocketWrapper } from "../lib/store/sockets/socket";
const listenOptions = {
    port: 3005
};
const tcpSockets = Store.getStore();
const serverWrapper = TCPHTTPSwitchServer(
    (socket:tcpsocket) => socketHandler(socket, tcpSockets),
    httpApp,
    (websocket: Socket) => socketHandler(websocket,tcpSockets),
);
serverWrapper.listen(listenOptions, () => console.log(`listenting on ${listenOptions.port}`));

const serverUser = User.createUser("server", new TCPSocketWrapper(new tcpsocket(), -1));
process.openStdin().on(
    'data',
    keyBoardLine => tcpSockets.forEachSocket(socket => socket.write(new TextMessagePostResponse(
            new TextMessagePostRequest({
                    body: keyBoardLine,
                    destination: { type: DestinationTypes.channel, val: "any" } 
            })
            ,serverUser
        )
    ))
);

