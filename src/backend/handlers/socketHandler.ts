import { Store } from "../../lib/store/store";
import { User } from "../../lib/store/user/user";
import {  SocketWrapper } from "../../lib/store/sockets/socket";
import { UserPostResponse, UserPostRequest, ChannelPostRequest, ChannelPostResponse } from "../../lib/messages/messages";
import {messageHandler} from "./requestHandler";

export const socketHandler = async (
    socket,// raw socket
    rerouteToHttp
) => {
    let socketWrapper = SocketWrapper.createSocketWrapper(socket);
    console.log("IdentityGetter try", (socket as any)._handle && (socket as any)._handle.fd && { fd: (socket as any)._handle.fd });
    let { user, isJson,isHttp,chunk } = await socketWrapper.getIdentity();
    if (user){
        console.log("new user", { name: user.username, id: user.id, isJson, swId: socketWrapper.id, handle: socket._handle && socket._handle.fd  });
        User.addUser(user)
            .addChannel(Store.defaultChannel);
        console.log(Object.entries(Store.getStore().users.store).map(([k, u]) => ({ name: u.username, sockets:Object.values(u.sockets.store)})))

        socketWrapper.configure(user, messageHandler);
        //timeout helps with websockets on polling transport for some reason
        setTimeout(()=>{
            console.log("write auth response to",user.username)
            socketWrapper.write(new UserPostResponse(new UserPostRequest({ userName: user.username }), user));
            
            //ensures channel message comes after user join message
            setTimeout(()=>{
                const joinChannelMessage = new ChannelPostResponse(
                    new ChannelPostRequest({
                        channelName: Store.defaultChannel.name,
                        switchTo: true
                    }), user, Store.defaultChannel
                );
                Store.defaultChannel.forEachUser(u => u.writeToAllSockets(joinChannelMessage))
            },100)
        },100)

    } else if (isHttp){
        console.log("socket upgrade to HTPP",{fd: (socket as any)._handle && (socket as any)._handle.fd
            , user, isJson, isHttp, chunk} )
        rerouteToHttp(Buffer.from(chunk, 'utf8'))
    }
    else{
        console.error("bailed out of identity getter");
    }

}
