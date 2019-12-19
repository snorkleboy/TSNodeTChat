import { Channel } from "./channel/channel";
import { User } from "./user/user";
export interface IdedEntity {
    id: number;
}
export class RecordStore<T extends IdedEntity>{
    constructor(public store: { [key: number]: T } = {}) {this.store = store;}
    public forEach = (cb: (t: T, number) => void) => Object.entries(this.store).forEach(([id, object]) => cb(object, id));
    public add = (object: T) => { this.store[object.id] = object; return object };
    public remove = (object: T) => { delete this.store[object.id]; return object }
    public removeById = (id: number) => delete this.store[id]
    public toList = ()=>Object.values(this.store);
    public get = (id: number) => this.store[id];
    public getBy = (cb:(item:T)=>Boolean):T=>Object.values(this.store).find(item=>cb(item));
}
export class UserStore extends RecordStore<User>{}
export class ChannelStore extends RecordStore<Channel>{
    nameStore: { [key: string]: Channel } = {};
    add = (channel: Channel) => {
        this.store[channel.id] = channel;
        this.nameStore[channel.name] = channel;
        return channel;
    }
    getByName = (name: string) => {
        return this.nameStore[name];
    }
    getList = () => Object.values(this.store)
}



        // this.dynamicName = name;
        // this[`forEach${capitlizedName}`] = (cb: (T, number) => {}) => Object.entries(store).forEach(([id, object]) => cb(object, id));
        // this[`add${capitlizedName}`] = (object: T) => store[object.id] = object;
        // this[`remove${capitlizedName}`] = (object: T) => delete store[object.id]