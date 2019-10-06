import { createServer as createHTTPServer} from 'http';
import { peekIsHttp } from "./util/peakIsHttp";
import { TCPClientSocketHandler } from './handlers/socketHandler/socketHandler';
const Net = require('net');
const port = 3005;
export const TCPHTTPSwitchServer = (
    onConnectNonHTTPTCPSocket,
    httpRequestHandler,
    options
) => {
    console.log("server start");
    const tcpServer = new Net.Server();
    const httpServer = createHTTPServer(httpRequestHandler);
    tcpServer.on('connection', (socket) => {
        const httpBool = peekIsHttp(socket);
        console.log({ fd: socket._handle.fd, httpBool });
        if (httpBool) {
            httpServer.emit("connection", socket);
        } else {
            onConnectNonHTTPTCPSocket(socket);
        }
    });
    return { tcpServer, httpServer, listen: (listenOptions, cb) => tcpServer.listen(listenOptions, cb)};
}
