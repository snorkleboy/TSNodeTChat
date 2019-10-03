import {Store} from "../store/store"
import { messageHandler as messageHandlerDef, MessageHandler} from "./messageHandler"
import { SocketWrapper } from "../store/socket";
import { User } from "../store/user";
import { MessageTypes, Message } from "../../messages/message";
function socketConfigurer(user: User, socket: SocketWrapper, store: Store, messageHandler: MessageHandler<Message,void> ) {
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
            messageHandler(parsed, store, user, socket);
        } catch (error) {
            console.error({ error,receivedDataChunk});
        }
    });
}


const getNextMessage = (socket)=>new Promise<any>((r,e)=>socket.once("data",(chunk)=>r(chunk)))

function IdentityGetter(socket:SocketWrapper, store: Store):Promise<User>{
    const endCB = () => {
        console.log('Closing connection with the client')
    }
    const errorCB = err => console.log(`Error: ${err}`)
    socket.socket.on('end', endCB);
    socket.socket.on('error', errorCB);
    return getNextMessage(socket.socket)
    .then(chunk=>{
        let userInfo;
        try {
            const parsed = JSON.parse(chunk);
            if (parsed && parsed.type && parsed.type === MessageTypes.login) {
                userInfo = parsed.payload.userName;
            }
        } catch (error) {
            userInfo = chunk.toString("utf8");
        }
        return userInfo;
    })
    .then((userInfo) => User.createUser(userInfo, socket))
    .finally(()=>{
        socket.socket.removeListener('end', endCB);
        socket.socket.removeListener('error', errorCB)
    })

}

export const socketHandler = async (
    socket,
    store: Store,
    messageHandler: MessageHandler<Message,void> = messageHandlerDef
) => {
    let socketWrapper = SocketWrapper.createSocketWrapper(socket);
    let user = await IdentityGetter(socketWrapper, store);
    console.log("new user",user.username,user.id);
    user.addChannel(Store.defaultChannel);
    socketConfigurer(user, socketWrapper, store, messageHandler);
}
