import { createServer as createHTTPServer} from 'http';
import { peekIsHttp } from "../util/peakIsHttp";
import IO from "socket.io";
import {Server, Socket} from "net"
const port = 3005;
export const TCPHTTPSwitchServer = (
    onConnectNonHTTPTCPSocket,
    httpRequestHandler,
    websocketHandler,
    options={}
) => {
    console.log("server start");
    const tcpServer = new Server();
    const httpServer = createHTTPServer(httpRequestHandler);
    const WebsocketServer = IO(httpServer);
    WebsocketServer.sockets.on("connection", websocketHandler);

    tcpServer.on('connection', (socket: Socket & { ['_handle']: any}) => peekIsHttp(socket).then(({httpBool,msg})=>{
        console.log("TCP connection",{ fd: socket._handle.fd, httpBool });
            if (httpBool) {
                httpServer.emit("connection", socket);
                socket.emit("data", msg);
            } else {
                onConnectNonHTTPTCPSocket(socket);
                socket.emit("data",msg);
            }
        })
    );
    tcpServer.on("error", (e) => console.error("tcp server", { e }));
    return { tcpServer, httpServer, websocketHandler, listen: (listenOptions, cb) => tcpServer.listen(listenOptions, cb)};
}
