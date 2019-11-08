import { createServer as createHTTPServer} from 'http';
import { peekIsHttp } from "./util/peakIsHttp";
import IO from "socket.io";
import {Server, Socket} from "net"
import { RawSocket } from '../lib/store/sockets/socket';
const port = 3005;


export const TCPHTTPSwitchServer = (
    socketHandler:(s:RawSocket)=>void,
    httpRequestHandler,
    options={}
) => {
    console.log("server start");
    const tcpServer = new Server();
    const httpServer = createHTTPServer(httpRequestHandler);
    const WebsocketServer = IO(httpServer,{
        pingInterval: 10000,
        pingTimeout: 50000,
    });
    WebsocketServer.on("connection", socketHandler);

    tcpServer.on('connection', (socket: Socket & { ['_handle']: any}) => {
        console.log("new TCP connection", { fd: socket && socket._handle && socket._handle.fd,});
        return peekIsHttp(socket)
            .then(({ httpBool, msg }) => {
                console.log("TCP peaked for http", { httpBool, fd: socket && socket._handle && socket._handle.fd, });
                try {
                    if (httpBool) {
                        httpServer.emit("connection", socket);
                        socket.emit("data", msg);
                    } else {
                        socketHandler(socket);
                        socket.emit("data", msg);
                    }
                } catch (error) {
                    console.error("socket to server level error", { error, socket });
                }

            })
    }
    );
    tcpServer.on("error", (e) => console.error("tcp server", { e }));
    return { tcpServer, httpServer, WebsocketServer, listen: (listenOptions, cb) => tcpServer.listen(listenOptions, cb)};
}
