import { TCPHTTPSwitchServer} from "./server";
import { socketHandler } from "./sockets/socketHandler";
import { Sockets as SocketStore } from "./sockets/sockets";

const tcpSockets = new SocketStore();
process.openStdin()
    .on(
        'data',
        keyBoardLine => tcpSockets.forEachSocket(socket => socket.write(keyBoardLine))
    );
const { tcpServer, httpServer } = TCPHTTPSwitchServer(
    (socket)=>socketHandler(socket, tcpSockets)
);
tcpServer.on("error", (e) => console.error("tcp server",{ e }));
