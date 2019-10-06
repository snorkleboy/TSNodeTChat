import { messageHandler } from "../requestHandler";
import { IdentityGetter } from "./identityGetter";
import { User, SocketWrapper, Store } from "../../../lib/store";
type SocketConfigurer = (user: User, socket: SocketWrapper, store: Store) => any;
const socketCofigurators :{ [key: string]: SocketConfigurer}= {
    "jsonClient": (user: User, socket: SocketWrapper, store: Store)=> {
        socket.socket.on('end', () => {
            console.log('Closing connection with the client');
            socket.socket.destroy();
            user.removeSocket(socket);
        });
        socket.socket.on('error', err => {
            console.log(`Socket Error: ${err}`)
            socket.socket.destroy();
            user.removeSocket(socket);
        })
        socket.socket.on('data', (receivedDataChunk) => {
            try {
                const parsed = JSON.parse(receivedDataChunk);
                messageHandler(parsed, store, user);
            } catch (error) {
                console.error("json parse error", { error, receivedDataChunk });
            }
        });
    },
    "bareClient": (user: User, socket: SocketWrapper, store: Store)=>{
        console.log("not implimented yet");
    }
}


export const TCPClientSocketHandler = async (
    socket,
    store: Store,
) => {
    let socketWrapper = SocketWrapper.createSocketWrapper(socket);
    let{user,isJson} = await IdentityGetter(socketWrapper, store);
    if(user){
        console.log("new user", { name: user.username, id: user.id, isJson });
        socketCofigurators[isJson ? "jsonClient" : "bareClient"](user, socketWrapper, store)
    }else{
        console.error("bailed out of identity getter");
    }

}
