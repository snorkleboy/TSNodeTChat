import { ChannelStore, UserStore } from "./recordStore";


export class Store { private constructor(){};
    public static getStore = () => {
        if (!Store.Store){
            Store.Store = new Store()
        }
        return Store.Store
    };
    private static Store:Store;
    public static defaultChannel;
    public channels: ChannelStore = new ChannelStore({ 0: Store.defaultChannel});
    public users: UserStore = new UserStore();
    public forEachSocket = (cb) => this.users.forEach(user=>user.forEachSocket(socket=>cb(socket,user)));
}

