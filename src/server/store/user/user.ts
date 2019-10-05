import { ChannelStore, RecordStore, Store, IdedEntity } from "../store";
import { Channel } from "../channel/channel";
import { SocketWrapper } from "../sockets/socket";
let userId = 0;

const getNewUserId = ()=>userId++;
export class User implements IdedEntity {
    private constructor(public id: number, public username: string, socket: SocketWrapper){
        this.addSocket(socket);
    };
    channels: ChannelStore = new ChannelStore();
    sockets: RecordStore<SocketWrapper> = new RecordStore<SocketWrapper>();
    forEachSocket = (cb:(s:SocketWrapper)=>void) => this.sockets.forEach((s)=>cb(s));
    writeToAllSockets = (m:string)=>this.sockets.forEach(s=>s.write(m));
    addSocket = (socket:SocketWrapper)=>this.sockets.add(socket);
    removeSocket = (socket)=>this.sockets.remove(socket);
    addChannel = (channel:Channel)=>{
        this.channels.add(channel);
        channel.users.add(this);
    }

    static getUser = (id: number): User => Store.getStore().users.get(id);
    static addUser = (user): User => Store.getStore().users.add(user);
    static createUser = (name: string, socket: SocketWrapper) => new User(getNewUserId(), name, socket);
    static forEachUser = ()=>Store.getStore().users.forEach;
}

