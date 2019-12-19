import {IdedEntity} from "../recordStore"
import { Socket as TCPSocket} from "net";
import { Socket as Websocket } from "socket.io";
import { User } from "../user/user";
import { websocketIdentityGetter, checkLoginMessage,handleIdentityChunk } from "./identityGetter";
import { MessageHandlerGen } from "../../messages/messageTypeExport";
import { HandledRequests, UserPostRequest } from "../../messages/messages";
import {  MessageLike } from "../../messages/message";
import { TCPClient } from "../../../clients/tcpClient/tcpClient";
import {identityReturn} from "./identityGetter"
import {websocketMessageEventName} from "./socketName"
type ConfigureSocket = (user: User, messageHandler: MessageHandlerGen<HandledRequests>)=>void;
const configureSocket: ConfigureSocket = function(user: User, messageHandler: MessageHandlerGen<HandledRequests>) {
    const destroy = (e) => {
        console.log('destroying socket connection with the client',{e});
        user.removeSocket(this);
        this.destroy();
    }
    this.on('close', (e) => {
        console.log('Closing connection with the client');
        destroy(e);
    });
    this.on('error', err => {
        console.log(`Socket Error: ${err}`)
        destroy(err);
    })
    this.on('data', (msg) => {
        try {
            console.log("received message",{msg:JSON.stringify(msg)});
            messageHandler(msg, user);
        } catch (error) {
            console.error("message handle error", { error, msg });
        }
    });
    this.messageHandler = messageHandler;
    this.user = user;
    console.log("socket configured", user.username);
}
const isTCPSocket = (s: TCPSocket): s is TCPSocket=>!!((s as TCPSocket)._writev && s.cork && s.unref)
const isWebSocket = (s:Websocket):s is Websocket=> !!(s.compress && s.volatile)
let currId: number = 0;
const getNewSocketId = () => currId++;
export type RawSocket = TCPSocket | Websocket  
export type WrappedSocket = TCPSocketWrapper | WebSocketWrapper | FakeServerSocket
export abstract class SocketWrapper<T extends RawSocket> implements IdedEntity{
    constructor(public socket: T,public id:number){};
    public configure: ConfigureSocket = configureSocket.bind(this);
    protected user:User;
    protected messageHandler: MessageHandlerGen<HandledRequests>;
    abstract write:(msg:MessageLike)=>void;
    abstract on:(event:string,cb)=>void;
    abstract once:(event:string,cb)=>void;
    abstract destroy:()=>void;
    abstract getIdentity: () => Promise<identityReturn>;
    toJson = ()=>({
        user:this.user.id,
        fd:(this.socket as any)?._handle?.fd
    })
    static createSocketWrapper = (socket): TCPSocketWrapper | WebSocketWrapper => {
        if (isWebSocket(socket)){
            return new WebSocketWrapper(socket, getNewSocketId());
        } else if (isTCPSocket(socket)){
            return new TCPSocketWrapper(socket, getNewSocketId());
        }else{
            console.error("unknown socket type");
        }
    };
}
export class FakeServerSocket extends SocketWrapper<any>{
    constructor(s,i){
        super(s,i);
    }
    write = ()=>{};
    on = ()=>{};
    once = ()=>{};
    destroy = ()=>{};
    getIdentity = async () => ({ user: User.serverUser, isJson: true, isHttp:false,err:null})
}
User.serverUser = User.createUser("server user", new FakeServerSocket({}, -1));

export class TCPSocketWrapper extends SocketWrapper<TCPSocket> {
    clientSendsJson:Boolean;
    user: User;
    videoPartner:any = false;
    tcpClient:TCPClient;
    notJsonDataCBs = [];
    configure = (user: User, messageHandler: MessageHandlerGen<HandledRequests>)=>{
        configureSocket.bind(this)(user, messageHandler);
    }
    write = (msg: MessageLike) => {
        if(this.clientSendsJson){
            let msgS = JSON.stringify(msg)
            // console.log("write to socket.write", { msgS,isjsonClient:this.clientSendsJson})
            this.socket.write(msgS);
        }else{
            // console.log("write to tcpClient.receiveFromServer", { msg, isjsonClient: this.clientSendsJson })
            this.tcpClient.receiveFromServer(msg);
        }
    }
    private onDataIsJson = (m,next)=>{
        let json;
        try {
            json = JSON.parse(m.toString());
        } catch (error) {
            console.error("socket parse error", { id: this.id, m });
        }
        next(json);
    }
    private onDataNotJson = (m,cb)=>{
        let str = m.toString().replace(/\n$/, "")
        this.tcpClient.receiveFromClient(str);
    }
    on = (e,cb)=>{
        if(e === "data"){
            !this.clientSendsJson && this.notJsonDataCBs.push(cb);
            this.socket.on("data",(m)=>{
                if(this.clientSendsJson){
                    this.onDataIsJson(m,cb);
                }else{
                    this.onDataNotJson(m,cb);
                }
            })
        }else{
            this.socket.on(e,cb);
        }
    }
    //todo
    //doesnt give back json, as it may not be json for some clients... needs to be split into json client and bare client with adapter
    once = (e, cb) => this.socket.once(e,cb);
    makeTCPHandler = ()=>{
        let firstMessage = true;
        const rawTCPHandler = new TCPClient(
            {
                sendToClient: (m) => {
                    //clears view after first 'render'
                    if(!firstMessage){
                        m = `\n\n\n\n\n\n\n\n\n\n${m}`
                    }
                    firstMessage = false;
                    this.socket.write(m)
                },
                sendToServer: (m) => {
                    if (this.notJsonDataCBs.length < 1) {
                        console.warn("send to server called with no on data callbacks", { m, this: this });
                    }
                    this.notJsonDataCBs.forEach(cb => cb(m));
                },
            }, () => {
                rawTCPHandler.start();
            }
        );
        return rawTCPHandler;
    }
    getIdentity = () => {
        const that = this;
        return new Promise<identityReturn>((resolve, e) => {
            const rawTCPHandler = this.makeTCPHandler();
            rawTCPHandler.authenticate(m=>
                {
                    const identityReturn = handleIdentityChunk(m, this);
                    const { isJson, err, user, chunk, isHttp } = identityReturn;
                    this.clientSendsJson = isJson;
                    this.user = user;
                    const message = isHttp? "rerouting to http server" :
                        isJson ? "resolving identity as JSONTCPClient" : "waiting for raw tcp handler for identity";
                    console.log("auth", { message,isHttp,isJson, m, fd: (this.socket as any)._handle.fd,user:(user as User)?.username }, );
                    if (isJson || isHttp){
                        resolve(identityReturn)
                    }
                    return !isJson && !isHttp;
                },m=>
                {
                    that.tcpClient = rawTCPHandler;
                    const identityReturn = checkLoginMessage(m, this);
                    console.log("auth", { m, fd: (this.socket as any)._handle.fd },"raw tcp style");
                    resolve({ ...identityReturn, isHttp:false});
                }
            )     
            this.socket.once("data", (m) => rawTCPHandler.receiveFromClient(m.toString().replace(/\n$/, "")));

        });
    }
    destroy = ()=>this.socket.destroy();

}

const renamer = (e)=>{
    let renamedEvent = e;
    if (e === "close") {
        renamedEvent = "disconnect";
    }
    return renamedEvent
}
export class WebSocketWrapper extends SocketWrapper<Websocket>{
    write = (msg) => {
        // console.log("write to websocket",this.user.username,{msg});
        this.socket.emit(websocketMessageEventName, JSON.stringify(msg))
    }
    once = (e, cb) =>this.socket.once(renamer(e), cb)
    on = (e,cb)=>{
        if (e=== "data"){
            this.socket.on("data", (m)=>{
                //TODO what is this
                console.log("ws on data",{m,type:typeof m})
                let json;
                try {
                    json = JSON.parse(m.toString());
                } catch (error) {
                    console.error("socket parse error", { id: this.id, m });
                }
                cb(json);
            });
        }else{
            this.socket.on(renamer(e),cb)
        }
    }
    getIdentity = () => websocketIdentityGetter(this);
    destroy = ()=>{

    };
}