import { SocketWrapper } from "./socket";
import { Channel } from "./channel";
import { User } from "./user";
export interface IdedEntity{
    id:number;
}
export class RecordStore<T extends IdedEntity>{
    constructor(public store:{[key:number]:T} = {}){
        // this.dynamicName = name;
        // this[`forEach${capitlizedName}`] = (cb: (T, number) => {}) => Object.entries(store).forEach(([id, object]) => cb(object, id));
        // this[`add${capitlizedName}`] = (object: T) => store[object.id] = object;
        // this[`remove${capitlizedName}`] = (object: T) => delete store[object.id]
    }
    public forEach = (cb: (t:T, number) => void) => Object.entries(this.store).forEach(([id, object]) => cb(object, id));
    public add = (object: T) => this.store[object.id] = object;
    public remove = (object: T) => delete this.store[object.id]
    public removeById = (id: number) => delete this.store[id]

    public get = (id:number)=>this.store[id];
}
class UserStore extends RecordStore<User>{

}
export class ChannelStore extends RecordStore<Channel>{
    nameStore :{[key:string]:Channel} = {};
    add = (channel:Channel)=>{
        this.store[channel.id] = channel;
        this.nameStore[channel.name] = channel;
        return channel;
    }
    getByName = (name:string)=>{
        return this.nameStore[name];
    }
}

export class Store { private constructor(){};
    static createStore = () => {Store.Store = new Store(); return Store.Store}
    static getStore = () => Store.Store;
    private static Store:Store;
    public static defaultChannel = Channel.createChannel("all")
    public channels: ChannelStore = new ChannelStore({ 0: Store.defaultChannel});
    public users: UserStore = new UserStore();
    public forEachSocket = (cb) => this.users.forEach(user=>user.forEachSocket(socket=>cb(socket,user)));
}

