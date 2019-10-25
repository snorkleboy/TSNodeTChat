import { User } from "../user/user"
import { IdedEntity, RecordStore } from "../recordStore";
import { Store } from "../store";
let channelId = 0;
const getNewChannelId = () => channelId++;
export class Channel implements IdedEntity {
    private constructor(public id:number,public name:string){};
    defaultChannel:Channel;
    users: RecordStore<User> = new RecordStore<User>();
    forEachUser = (cb: (user: User) =>void)=>this.users.forEach(user=>cb(user));
    addUser = (user:User)=>{
        this.users.add(user);
        user.channels.add(this);
        return user; 
    }
    removeUser = (user: User)=>this.users.remove(user);
    getUserByName = (name:string):User=>this.users.getBy(u=>u.username === name);
    static getChannel = (id: number): Channel => Store.getStore().channels.get(id);
    static getChannelByName = (name: string): Channel => Store.getStore().channels.getByName(name);
    static addChannel = (channel): Channel => Store.getStore().channels.add(channel);

    static createChannel = (name): Channel => new Channel(getNewChannelId(), name);
    static getOrCreateChannel = (name:string)=>{
        let isNew = false;
        let channel = Channel.getChannelByName(name);
        if(!channel){
            channel = Channel.addChannel(Channel.createChannel(name))
            isNew = true;
        }
        return {channel,isNew};
    }
    static forEachUser = () => Store.getStore().channels.forEach;

}

Store.defaultChannel = Channel.getOrCreateChannel("all").channel;