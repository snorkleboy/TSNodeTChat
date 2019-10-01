import { Sockets as SocketStore } from "./sockets/sockets";
import { socketHandler } from "./sockets/socketHandler";
import { createServer as createHTTPServer} from 'http';
const Net = require('net');
var peek = require('socket-peek');


const isHttp = (str:string)=>{
    if(!str){
        return false;
    }
    const newLine = str.indexOf("\n") || 100;
    const split = str.slice(0, newLine ).split(`/`);
    if(!split[1]){
        return false;
    }
    if(split[1].toLocaleLowerCase().includes("http")){
        return true;
    }else{
        return false;
    }
}
const peekIsHttp = (socket) => {
    var buffer = Buffer.alloc(1000);
    var ret = peek(socket._handle.fd, 1000, buffer);
    let msg;
    let httpBool = false;
    if (ret > 0) {
        msg =  buffer.slice(0, ret).toString('utf8');
        httpBool = isHttp(msg);
    }else{
        msg = "no message";
    }
    return httpBool;
}

const port = 3005;
export const startServer = (options = {}) => {
    console.log("server start");
    let sockets = new SocketStore();
    process.openStdin()
        .on(
            'data',
            keyBoardLine => sockets.forEachSocket(socket => socket.write(keyBoardLine))
        );
    const tcpServer = new Net.Server();
    const httpServer = createHTTPServer((req,res)=>res.end("hello httpServer"));
    tcpServer.listen(port, () => console.log(`Server listening for connection requests on socket localhost:${port}`));
    tcpServer.on('connection', (socket) => {
        const httpBool = peekIsHttp(socket);
        console.log({ fd: socket._handle.fd, httpBool });
        if (httpBool){
            httpServer.emit("connection", socket);
        }else{
            socketHandler(socket, sockets)
        }
    });
    tcpServer.on("error", (e) => console.error("tcp server",{ e }));


}
