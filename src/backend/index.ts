import { TCPHTTPSwitchServer} from "./tcp/server";
import { Store } from "../lib/store/store";
import { TCPClientSocketHandler} from "./handlers/socketHandler/socketHandler";
import { TextMessagePostRequest, TextMessagePostResponse } from "../lib/messages/messages";
import { DestinationTypes } from "../lib/messages/message";
import { httpApp } from "./http/httpApp";
import { User } from "../lib/store/user/user";
import { Socket } from "socket.io";
const listenOptions = {
    port: 3005
};
const tcpSockets = Store.getStore();
const serverWrapper = TCPHTTPSwitchServer(
    (socket) => TCPClientSocketHandler(socket, tcpSockets),
    httpApp,
    (websocket:Socket) => {
        websocket.emit('message', 'You are connected!');

        // When the server receives a “message” type signal from the client   
        websocket.on('message', function (message) {
            console.log(message);
        }); 
    },
);
serverWrapper.listen(listenOptions, () => console.log(`listenting on ${listenOptions.port}`));

const serverUser = User.createUser("server",{id:null,socket:null,write:()=>{}});
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

