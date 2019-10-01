import { Sockets as SocketStore } from "./sockets/sockets";
import { socketHandler } from "./sockets/socketHandler";
import { createServer as createHTTPServer} from 'http';
import { peekIsHttp } from "./util/peakIsHttp";
const Net = require('net');
const port = 3005;


export const startServer = (options?,httpHandler?) => {
    console.log("server start");
    let tcpSockets = new SocketStore();
    process.openStdin()
        .on(
            'data',
            keyBoardLine => tcpSockets.forEachSocket(socket => socket.write(keyBoardLine))
        );

    const tcpServer = new Net.Server();
    const httpServer = createHTTPServer(options, httpHandler || ((req, res)=> res.end("hello httpServer")));


    tcpServer.listen(port, () => console.log(`Server listening for connection requests on socket localhost:${port}`));
    tcpServer.on('connection', (socket) => TCPHTTPSwitch(socket, tcpSockets, httpServer));
    return {tcpServer,httpServer};
}

const TCPHTTPSwitch = (socket, tcpSockets, httpServer) => {
    const httpBool = peekIsHttp(socket);
    console.log({ fd: socket._handle.fd, httpBool });
    if (httpBool) {
        httpServer.emit("connection", socket);
    } else {
        socketHandler(socket, tcpSockets)
    }
}