import { Store } from "../../lib/store/store";
import { User } from "../../lib/store/user/user";
import {  SocketWrapper } from "../../lib/store/sockets/socket";
import { UserPostResponse, UserPostRequest } from "../../lib/messages/messages";
import {messageHandler} from "./requestHandler";
export const socketHandler = async (
    socket,// raw socket
    store: Store,
) => {
    let socketWrapper = SocketWrapper.createSocketWrapper(socket);
    let { user, isJson } = await socketWrapper.getIdentity();
    if(user){
        console.log("new user", { name: user.username, id: user.id, isJson, handle: socket._handle && socket._handle.fd  });
        User.addUser(user);
        socketWrapper.configure(user, store, messageHandler);
        socketWrapper.write(JSON.stringify(new UserPostResponse(new UserPostRequest({ userName: user.username }), user)));
    }else{
        console.error("bailed out of identity getter");
    }

}
