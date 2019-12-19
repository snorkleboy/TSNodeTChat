import { ChannelStore, RecordStore, IdedEntity } from "../recordStore"
import { Channel } from "../channel/channel";
import {  WrappedSocket } from "../sockets/socket";
import { Store } from "../store";
import { MessageLike } from "../../messages/message";
let userId = 0;

const getNewUserId = ()=>userId++;
export class User implements IdedEntity {
    private constructor(public id: number, public username: string, socket: WrappedSocket){
        this.addSocket(socket);
    };
    channels: ChannelStore = new ChannelStore();
    sockets: RecordStore<WrappedSocket> = new RecordStore<WrappedSocket>();
    forEachSocket = (cb: (s: WrappedSocket)=>void) => this.sockets.forEach((s)=>cb(s));
    writeToAllSockets = (m:MessageLike)=>this.sockets.forEach(s=>s.write(m));
    addSocket = (socket: WrappedSocket)=>this.sockets.add(socket);
    removeSocket = (socket)=>{
        this.sockets.remove(socket);
        if(Object.keys(this.sockets.store).length === 0){
            this.channels.forEach(c=>c.removeUser(this));
            console.log("user leave all channels");
        }
    }

    addChannel = (channel:Channel)=>{
        this.channels.add(channel);
        channel.users.add(this);
        return this;
    }
    static serverUser:User;
    static getUser = (id: number): User => Store.getStore().users.get(id);
    static getUserByName = (name: string): User => {
        let user;
        Store.getStore().users.forEach(u => {
            if (u.username === name) {
                user = u;
            }
        })
        return user;
    }
    

    static addUser = (user): User => Store.getStore().users.add(user);
    static createUser = (name: string, socket: WrappedSocket) => new User(getNewUserId(), name, socket);
    static forEachUser = ()=>Store.getStore().users.forEach;
}

