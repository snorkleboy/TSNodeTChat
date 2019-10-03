import { User } from "./user"
import { IdedEntity, RecordStore, Store } from "./store";
let channelId = 0;
const getNewChannelId = () => channelId++;
export class Channel implements IdedEntity {
    private constructor(public id:number,public name:string){};

    users: RecordStore<User> = new RecordStore<User>();
    forEachUser = (cb: (user: User) =>void)=>this.users.forEach(user=>cb(user));
    addUser = (user:User)=>{
        this.users.add(user);
        user.channels.add(this);
        return user; 
    }
    removeUser = (user: User)=>this.users.remove(user);

    static getChannel = (id: number): Channel => Store.getStore().channels.get(id);
    static getChannelByName = (name: string): Channel => Store.getStore().channels.getByName(name);
    static addChannel = (channel): Channel => Store.getStore().channels.add(channel);

    static createChannel = (name): Channel => new Channel(getNewChannelId(), name);
    static getOrCreateChannel = (name:string)=>{
        let channel = Channel.getChannelByName(name);
        if(!channel){
            channel = Channel.addChannel(Channel.createChannel(name))
        }else{
            console.log("got existing channel", { channel });
        }
        return channel;
    }
    static forEachUser = () => Store.getStore().channels.forEach;

}