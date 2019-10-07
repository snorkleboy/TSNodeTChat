import {IdedEntity} from "../recordStore"
import { Socket as TCPSocket, Socket} from "net";
import { Socket as Websocket } from "socket.io";
import { User } from "../user/user";
import { TCPIdentityGetter, websocketIdentityGetter } from "./identityGetter";


const isTCPSocket = (s: TCPSocket): s is TCPSocket=>!!((s as TCPSocket)._writev && s.cork && s.unref)
const isWebSocket = (s:Websocket):s is Websocket=> !!(s.compress && s.volatile)
let currId: number = 0;
const getNewSocketId = () => currId++;
export type RawSocket = TCPSocket | Websocket  
export type WrappedSocket = TCPSocketWrapper | WebSocketWrapper
export abstract class SocketWrapper<T extends RawSocket> implements IdedEntity{
    constructor(public socket: T,public id:number){};
    abstract write:(msg:string)=>void;
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

export class TCPSocketWrapper extends SocketWrapper<TCPSocket> {
    write = (msg:string)=>this.socket.write(msg);
    on = (e,cb)=>this.socket.on(e,cb)
    once = (e, cb) => this.socket.once(e,cb);
    getIdentity = () => TCPIdentityGetter(this);
    destroy = ()=>this.socket.destroy();

}

export const websocketMessageEventName = "data";
export class WebSocketWrapper extends SocketWrapper<Websocket>{
    write = (msg) => {
        console.log("send to websocket",{msg});
        this.socket.emit(websocketMessageEventName,msg)
    }
    once = (e, cb) => this.socket.once(e, cb)
    on = (e,cb)=>{
        let renamedEvent = e;
        if(e === "end"){
            renamedEvent = "dissconnect";
        }
        this.socket.on(renamedEvent,cb);
    }
    getIdentity = () => websocketIdentityGetter(this);
    destroy = ()=>{};
}