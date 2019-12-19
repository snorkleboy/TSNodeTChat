import { createServer as createHTTPSServer} from 'https';
import { createServer as createHTTPServer } from 'http';

import { peekIsHttp } from "./util/peakIsHttp";
import IO from "socket.io";
import {Server, Socket} from "net"
import { RawSocket } from '../lib/store/sockets/socket';
const fs = require('fs');

const httpsOptions = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.cert')
}
export const TCPHTTPSwitchServer = (
    socketHandler:(s:RawSocket,httpReRout:(m)=>void)=>void,
    httpRequestHandler,
) => {
    console.log("server start");
    const tcpServer = new Server();
    const httpServer = createHTTPServer(httpRequestHandler);
    const httpsServer = createHTTPSServer(httpsOptions,httpRequestHandler);
    const WebsocketServer = IO(httpServer,{
        pingInterval: 10000,
        pingTimeout: 50000,
    });
    WebsocketServer.on("connection", socketHandler);

    tcpServer.on('connection', (socket: Socket & { ['_handle']: any}) => {
        console.log("new TCP connection", { fd: socket && socket._handle && socket._handle.fd,});
        return peekIsHttp(socket)
            .then(({ httpBool, msg }) => {
                console.log("TCP peaked http", { httpBool, fd: socket && socket._handle && socket._handle.fd, });
                try {
                    const handleHTTP = (m)=>{
                        httpServer.emit("connection", socket);
                        socket.emit("data", m);
                    }
                    if (httpBool) {
                        handleHTTP(msg)
                    } else {
                        socketHandler(socket, handleHTTP);
                        if(msg){
                            socket.emit("data", msg);
                        }
                    }
                } catch (error) {
                    console.error("socket to server level error", { error, socket });
                }

            })
    }
    );
    tcpServer.on("error", (e) => console.error("tcp server", { e }));
    return {
        tcpServer, httpServer, WebsocketServer, listen: (listenOptions, cb) => {
        tcpServer.listen(listenOptions, cb);
        httpsServer.listen({port:443},()=>{console.log("https listening on port 443")});
    }};
}
