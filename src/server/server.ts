import { createServer as createHTTPServer} from 'http';
import { peekIsHttp } from "./util/peakIsHttp";
const Net = require('net');
const port = 3005;

export const TCPHTTPSwitchServer = (
    tcpSocketHandler,
    options?,
    httpRequestHandler = ((req, res) => res.end("hello httpServer"))
) => {
    console.log("server start");
    const tcpServer = new Net.Server();
    const httpServer = createHTTPServer(options, httpRequestHandler );
    tcpServer.on('connection', (socket) => {
        const httpBool = peekIsHttp(socket);
        console.log({ fd: socket._handle.fd, httpBool });
        if (httpBool) {
            httpServer.emit("connection", socket);
        } else {
            tcpSocketHandler(socket);
        }
    });
    tcpServer.listen(port, () => console.log(`Server listening for connection requests on socket localhost:${port}`));
    return {tcpServer,httpServer};
}
