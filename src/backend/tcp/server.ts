import { createServer as createHTTPServer} from 'http';
import { peekIsHttp } from "../../lib/util/peakIsHttp";
var socketIOFactory = require('socket.io');
const Net = require('net');
const port = 3005;
export const TCPHTTPSwitchServer = (
    onConnectNonHTTPTCPSocket,
    httpRequestHandler,
    websocketHandler,
    options
) => {
    console.log("server start");
    const tcpServer = new Net.Server();
    const httpServer = createHTTPServer(httpRequestHandler);
    const WebsocketServer = socketIOFactory(httpServer);
    WebsocketServer.on("connection",websocketHandler);

    //if tcp socket recieves http message it is put into the http server which will trigger the httpRequestHandler, otherwise it goes to the TCPSocket Handler
    tcpServer.on('connection', (socket) => {
        const httpBool = peekIsHttp(socket);
        console.log({ fd: socket._handle.fd, httpBool });
        if (httpBool) {
            httpServer.emit("connection", socket);
        } else {
            onConnectNonHTTPTCPSocket(socket);
        }
    });
    tcpServer.on("error", (e) => console.error("tcp server", { e }));
    return { tcpServer, httpServer, websocketHandler, listen: (listenOptions, cb) => tcpServer.listen(listenOptions, cb)};
}
