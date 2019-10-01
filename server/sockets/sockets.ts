export interface ISocket{
    write:Function
}
// enum ClientType{
//     noClient = "NOCLIENT",
//     withClient="WITHCLIENT"
// }
// class User{
//     socket:ISocket
//     clientType: ClientType
//     write:Function
// }
export class Sockets {
    sockets: Record<number, ISocket> = {};
    addSocket = (id, socket) => this.sockets[id] = socket;
    removeSocket = (id) => delete this.sockets[id];
    forEachSocket = (cb) => Object.entries(this.sockets).forEach(([id, socket]) => cb(socket, id));
}

