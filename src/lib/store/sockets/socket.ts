import {IdedEntity} from "../recordStore"
import { Socket as TCPSocket, Socket} from "net";
import { Socket as Websocket } from "socket.io";
import { User } from "../user/user";
import { TCPIdentityGetter, websocketIdentityGetter } from "./identityGetter";
import { Store } from "../store";
import { MessageHandlerGen } from "../../messages/messageTypeExport";
import { HandledRequests, TextMessagePostRequest, TextMessagePostResponse } from "../../messages/messages";
import { DestinationTypes, MessageLike, MessageTypes, ActionTypes } from "../../messages/message";
import { newLineArt } from "../../util/newline";

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
            console.log("received message",{msg});
            messageHandler(msg, user);
        } catch (error) {
            console.error("message handle error", { error, msg });
        }
    });
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
    abstract write:(msg:MessageLike)=>void;
    abstract on:(event:string,cb)=>void;
    abstract once:(event:string,cb)=>void;
    abstract destroy:()=>void;
    abstract getIdentity: () => Promise<{ user:User, isJson:Boolean }>;
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
    getIdentity = async () => ({user:User.serverUser,isJson:true})
}
User.serverUser = User.createUser("server user", new FakeServerSocket({}, -1));

export class TCPSocketWrapper extends SocketWrapper<TCPSocket> {
    isJson:Boolean;
    user: User;
    configure = (user: User, messageHandler: MessageHandlerGen<HandledRequests>)=>{
        configureSocket.bind(this)(user, messageHandler);
    }
    write = (msg:MessageLike)=>{
        if(this.isJson){
                this.socket.write(JSON.stringify(msg), e => {
                if (e) {
                    console.log("tcp socket write error", { e, msg, sockId: this.id });
                    this.socket.emit("close");
                }
            })
        }else{
            if (
                msg.type === MessageTypes.textMessage && 
                msg.action === ActionTypes.post && 
                (msg as TextMessagePostResponse).isResponse && (msg as TextMessagePostResponse).payload.from.name !== this.user.username
            ){
                const lineStart = newLineArt((msg as TextMessagePostResponse).payload.from.name,"all",true)
                this.socket.write(`\n${lineStart}${(msg as TextMessagePostResponse).payload.body}\n`, e => {
                    if (e) {
                        console.log("raw tcp socket write error", { e, msg, sockId: this.id });
                        this.socket.emit("close");
                    }
                })
            }
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
    private onDataNotJson = (m,next)=>{
        console.error("raw client message, PARTAILLY IMPLIMENTED",{m});
        const str = m.toString();
        const channel = (c => c ? c.name : "all")(this.user.channels.getList[0]);
        const json = new TextMessagePostRequest(str,channel)
        console.log(this.user.channels.getList[0]);
        next(json);
    }
    on = (e,cb)=>{
        if(e === "data"){
            this.socket.on("data",(m)=>{
                if(this.isJson){
                    this.onDataIsJson(m,cb);
                }else{
                    this.onDataNotJson(m,cb);
                }
            })
        }else{
            this.socket.on(e,cb);
        }
    }
    //doesnt give back json, as it may not be json for some clients... needs to be split into json client and bare client with adapter
    once = (e, cb) => this.socket.once(e,cb);
    getIdentity = () => {
        const prom =  TCPIdentityGetter(this)   
        .then(ret=>{
            this.isJson = ret.isJson;
            this.user = ret.user;
            return ret;
        })
        
        return prom; 
    }
    destroy = ()=>this.socket.destroy();

}

export const websocketMessageEventName = "data";
const renamer = (e)=>{
    let renamedEvent = e;
    if (e === "close") {
        renamedEvent = "disconnect";
    }
    return renamedEvent
}
export class WebSocketWrapper extends SocketWrapper<Websocket>{
    write = (msg) => {
        this.socket.emit(websocketMessageEventName, JSON.stringify(msg))
    }
    once = (e, cb) =>this.socket.once(renamer(e), cb)
    on = (e,cb)=>{
        if (e=== "data"){
            this.socket.on("data", (m)=>{
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