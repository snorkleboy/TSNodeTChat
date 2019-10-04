import {Store} from "../store/store"
import { SocketWrapper } from "../store/socket";
import { User } from "../store/user";
import { MessageTypes, Message, HandledMessages } from "../../messages/message";
import { messageHandler } from "./messageHandler";

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


const getNextMessage = (socket)=>new Promise<any>((r,e)=>socket.once("data",(chunk)=>r(chunk)))
//at this point the socket is confired not HTTP, but it may be a fill json client or a 'barecleint' like telnet or netcat. 
async function IdentityGetter(socket:SocketWrapper, store: Store):Promise<{user:User,isJson:Boolean}>{
    const endCB = () => {
        console.log('Closing connection with the client')
    }
    const errorCB = err => console.log(`Error: ${err}`)
    socket.socket.on('end', endCB);
    socket.socket.on('error', errorCB);
    let user;
    let isJson;
    console.log("IdentityGetter try");
    while (!user){
        let userInfo;
        const chunk = await getNextMessage(socket.socket)
        //if json, try parse as login message or try again, else interpret non-json as user name;
        try {
            const parsed = JSON.parse(chunk);
            if (parsed && parsed.type && parsed.type === MessageTypes.login) {
                userInfo = parsed.payload.userName;
                isJson = true;
                user = User.createUser(userInfo, socket);
            }else{
                //try again;
            }
        //if initial message is not json then it is interpreted as name
        } catch (error) {
            userInfo = chunk.toString("utf8");
            if(userInfo && userInfo.length > 0){
                user = User.createUser(userInfo, socket);
                isJson = false;
            }else{
                // try again
            }
      
        }
    }
    socket.socket.removeListener('end', endCB);
    socket.socket.removeListener('error', errorCB);
    return { user, isJson};
}
export const TCPClientSocketHandler = async (
    socket,
    store: Store,
) => {
    let socketWrapper = SocketWrapper.createSocketWrapper(socket);
    let{user,isJson} = await IdentityGetter(socketWrapper, store);
    console.log("new user", { name:user.username, id:user.id, isJson});
    user.addChannel(Store.defaultChannel);
    socketCofigurators[isJson ? "jsonClient" :"bareClient"](user, socketWrapper, store)
}
