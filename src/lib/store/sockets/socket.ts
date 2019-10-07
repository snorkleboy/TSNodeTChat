import {IdedEntity} from "../recordStore"
import { Socket as TCPSocket, Socket} from "net";
import { Socket as Websocket } from "socket.io";
import { User } from "../user/user";
import { TCPIdentityGetter, websocketIdentityGetter } from "./identityGetter";
import { Store } from "../store";
import { MessageHandlerGen } from "../../messages/messageTypeExport";
import { HandledRequests } from "../../messages/messages";



const isTCPSocket = (s: TCPSocket): s is TCPSocket=>!!((s as TCPSocket)._writev && s.cork && s.unref)
const isWebSocket = (s:Websocket):s is Websocket=> !!(s.compress && s.volatile)
let currId: number = 0;
const getNewSocketId = () => currId++;
export type RawSocket = TCPSocket | Websocket  
export type WrappedSocket = TCPSocketWrapper | WebSocketWrapper
export abstract class SocketWrapper<T extends RawSocket> implements IdedEntity{
    constructor(public socket: T,public id:number){};
    configure = (user: User, store: Store, messageHandler:MessageHandlerGen<HandledRequests>) => {
        this.on('end', () => {
            console.log('Closing connection with the client');
            user.removeSocket(this);
            this.destroy();
        });
        this.on('error', err => {
            console.log(`Socket Error: ${err}`)
            user.removeSocket(this);
            this.destroy();
        })
        this.on('data', (msg) => {
            try {
                messageHandler(msg, store, user);
            } catch (error) {
                console.error("message handle error", { error, msg });
            }
        });
        console.log("socket configured", user.username);
    }
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
//io websockets automatically parse, so this socket does as well. 
export class TCPSocketWrapper extends SocketWrapper<TCPSocket> {
    write = (msg:string)=>this.socket.write(msg);
    on = (e,cb)=>{
        if(e === "data"){
            this.socket.on("data",(m)=>{
                let json;
                try {
                    json = JSON.parse(m.toString());
                } catch (error) {
                    console.error("socket parse error",{id:this.id,m});
                }
                cb(json);
            })
        }
    }
    //doesnt give back json, as it may not be json for some clients... needs to be split into json client and bare client with adapter
    once = (e, cb) => this.socket.once(e,cb);
    getIdentity = () => TCPIdentityGetter(this);
    destroy = ()=>this.socket.destroy();

}

export const websocketMessageEventName = "data";
const renamer = (e)=>{
    let renamedEvent = e;
    if (e === "end") {
        renamedEvent = "dissconnect";
    }
    return renamedEvent
}
export class WebSocketWrapper extends SocketWrapper<Websocket>{
    write = (msg) => {
        console.log("send to websocket",{msg});
        this.socket.emit(websocketMessageEventName,msg)
    }
    once = (e, cb) =>this.socket.once(renamer(e), cb)
    on = (e,cb)=>this.socket.on(renamer(e),cb);
    getIdentity = () => websocketIdentityGetter(this);
    destroy = ()=>{};
}