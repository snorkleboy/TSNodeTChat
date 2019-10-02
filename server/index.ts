import { TCPHTTPSwitchServer} from "./server";
import { socketHandler as TCPSocketHandler} from "./sockets/socketHandler";
import { Sockets as SocketStore } from "./sockets/sockets";

const tcpSockets = new SocketStore();
const { tcpServer, httpServer } = TCPHTTPSwitchServer(
    (socket) => TCPSocketHandler(socket, tcpSockets)
);
tcpServer.on("error", (e) => console.error("tcp server", { e }));

process.openStdin().on(
    'data',
    keyBoardLine => tcpSockets.forEachSocket(socket => socket.write(keyBoardLine))
);

