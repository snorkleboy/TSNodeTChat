import { TCPHTTPSwitchServer} from "./tcp/server";
import { Store } from "../lib/store/store";
import { socketHandler} from "./handlers/socketHandler";
import { TextMessagePostRequest, TextMessagePostResponse } from "../lib/messages/messages";
import { DestinationTypes } from "../lib/messages/message";
import { httpApp } from "./http/httpApp";
import { User } from "../lib/store/user/user";
import { Socket as tcpsocket } from "net";
import { TCPSocketWrapper, RawSocket } from "../lib/store/sockets/socket";
const listenOptions = {
    port: 3005
};
const store = Store.getStore();
const serverWrapper = TCPHTTPSwitchServer(
    (socket: RawSocket) => socketHandler(socket, store),
    httpApp,
);
serverWrapper.listen(listenOptions, () => console.log(`listenting on ${listenOptions.port}`));
const serverUser = User.createUser("server user", new TCPSocketWrapper(new tcpsocket(), -1));
process.openStdin().on(
    'data',
    keyBoardLine => store.forEachSocket(socket => socket.write(new TextMessagePostResponse(
            new TextMessagePostRequest({
                body: keyBoardLine,
                destination: { type: DestinationTypes.channel, val: "all" } 
            })
            ,serverUser
        )
    ))
);

