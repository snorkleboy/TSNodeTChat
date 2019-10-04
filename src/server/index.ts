import { TCPHTTPSwitchServer} from "./server";
import { TCPClientSocketHandler} from "./handlers/socketHandler";
import { Store } from "./store/store";

const options = {
    port: 3005
};
const tcpSockets = Store.createStore();
const serverWrappers = TCPHTTPSwitchServer(
    (socket) => TCPClientSocketHandler(socket, tcpSockets),
    (req, res) => res.end("hello httpServer"),
    options
);
serverWrappers.tcpServer.on("error", (e) => console.error("tcp server", { e }));
serverWrappers.listen(options,()=>console.log(`listenting on ${options.port}`))
process.openStdin().on(
    'data',
    keyBoardLine => tcpSockets.forEachSocket(socket => socket.write(keyBoardLine))
);

