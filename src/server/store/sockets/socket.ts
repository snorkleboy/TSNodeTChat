import { IdedEntity } from "../store";
let currId: number = 0;
const getNewSocketId = () => currId++;
export class SocketWrapper implements IdedEntity{
    private constructor(public socket: any,public id:number){};
    write:Function = (...args)=>this.socket.write(...args);

    static createSocketWrapper = (socket): SocketWrapper => new SocketWrapper(socket, getNewSocketId());
}

