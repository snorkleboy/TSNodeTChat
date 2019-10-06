import { TCPHTTPSwitchServer} from "./tcp/server";
import { Store, User } from "../lib/store/store";
import { TCPClientSocketHandler} from "./handlers/socketHandler/socketHandler";
import { TextMessagePostRequest, TextMessagePostResponse } from "../lib/messages/messages";
import { DestinationTypes } from "../lib/messages/message";
import { httpApp } from "./http/httpApp";
const options = {
    port: 3005
};
const tcpSockets = Store.getStore();
const serverWrapper = TCPHTTPSwitchServer(
    (socket) => TCPClientSocketHandler(socket, tcpSockets),
    httpApp,
    (websocket) => console.log({ websocket }),
    options
);
serverWrapper.listen(options,()=>console.log(`listenting on ${options.port}`));

const serverUser = User.createUser("server",{id:null,socket:null,write:()=>{}});
process.openStdin().on(
    'data',
    keyBoardLine => tcpSockets.forEachSocket(socket => socket.write(new TextMessagePostResponse(
        new TextMessagePostRequest({ body: keyBoardLine, destination: { type: DestinationTypes.channel, val: "any" } }),serverUser)
    ))
);

