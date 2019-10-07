import { messageHandler } from "../requestHandler";
import { TCPIdentityGetter } from "../../../lib/store/sockets/identityGetter";
import { Store } from "../../../lib/store/store";
import { User } from "../../../lib/store/user/user";
import { TCPSocketWrapper, RawSocket, WrappedSocket, SocketWrapper } from "../../../lib/store/sockets/socket";
import { UserPostResponse, UserPostRequest } from "../../../lib/messages/messages";
type SocketConfigurer = (user: User, socket: WrappedSocket, store: Store) => any;
const socketCofigurator : SocketConfigurer= (user: User, socket:WrappedSocket , store: Store)=> {
        socket.on('end', () => {
            console.log('Closing connection with the client');
            socket.destroy();
            user.removeSocket(socket);
        });
        socket.on('error', err => {
            console.log(`Socket Error: ${err}`)
            socket.destroy();
            user.removeSocket(socket);
        })
        socket.on('data', (msg) => {
            try {
                const t = typeof msg;
                if (t !== 'object' || (!msg.action && !msg.type)){
                    msg = JSON.parse(msg);
                }
                messageHandler(msg, store, user);
            } catch (error) {
                console.error("message handle error", { error, msg });
            }
        });
        console.log("socket configured", user.username);
}


export const socketHandler = async (
    socket,
    store: Store,
) => {
    let socketWrapper = SocketWrapper.createSocketWrapper(socket);
    let { user, isJson } = await socketWrapper.getIdentity();
    if(user){
        console.log("new user", { name: user.username, id: user.id, isJson, handle: socket._handle && socket._handle.fd  });
        User.addUser(user);
        socketWrapper.write(JSON.stringify(new UserPostResponse(new UserPostRequest({ userName: user.username }), user)));
        socketCofigurator(user, socketWrapper, store)
    }else{
        console.error("bailed out of identity getter");
    }

}
