import { TCPHTTPSwitchServer} from "./server";
import { socketHandler as TCPSocketHandler} from "./handlers/socketHandler";
import { Store } from "./store/store";

const tcpSockets = Store.createStore();
const { tcpServer, httpServer } = TCPHTTPSwitchServer(
    (socket) => TCPSocketHandler(socket, tcpSockets)
);
tcpServer.on("error", (e) => console.error("tcp server", { e }));

process.openStdin().on(
    'data',
    keyBoardLine => tcpSockets.forEachSocket(socket => socket.write(keyBoardLine))
);

