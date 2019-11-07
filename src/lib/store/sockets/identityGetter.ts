import { MessageTypes, ActionTypes } from "../../messages/message";
import { UserPostResponse } from "../../messages/messages";
import { Store } from "../store";
import { User } from "../user/user";

import { getNextMessage} from "../../util/getNextMessage";
import { TCPSocketWrapper, WebSocketWrapper, WrappedSocket } from "./socket";
//at this point the socket is 'confired' not HTTP, but it may be a full json client or a 'barecleint' like telnet or netcat.
//if an http message took longer than 500ms than it may be routed here
// if it takes longer than 10000ms for any message to come through this will bail out

type identityReturn = { user: User, isJson: Boolean,err:any };
type IdentityGetter =(socket:WrappedSocket)=> Promise<identityReturn>;

export const websocketIdentityGetter: IdentityGetter = async (socket: WebSocketWrapper): Promise<identityReturn> => {
    let user,isJson;
    let err;
    let tries = 0;
    while (!user && !err && tries < 3) {
        let msg = await getNextMessage(socket, 10000).catch(e => {
            err = true; 
            console.log("web socket identity timeout")
        });
        try {
            msg = JSON.parse(msg);
        } catch (error) {
            console.error("websocket json parse error",{msg});
        }
        ({ user, isJson } = checkLoginMessage(msg, socket))
        tries++;
    }
    return {user,isJson,err};
}
//this still may be a bare client or a json client
export const TCPIdentityGetter: IdentityGetter =async (socket: TCPSocketWrapper): Promise<identityReturn>=>{
    const endCB = () => {
        console.log('Closing connection with the client before Identity')
    }
    const errorCB = err => console.log(`Error before identity: ${err}`)
    socket.socket.on('end', endCB);
    socket.socket.on('error', errorCB);
    socket.socket.write("please enter name:");
    let err;
    let user;
    let isJson;
    let tries = 0;
    while (!user && !err && tries<3) {
        const chunk = await getNextMessage(socket,10000)
            .catch(e => {
                err = true;
                console.error("error getting identity message", e)
            })
        if (chunk) {
            ({
                user,
                isJson
            } = handleIdentityChunk(chunk, socket));
        }
    }
    socket.socket.removeListener('end', endCB);
    socket.socket.removeListener('error', errorCB);
    return {
        user,
        isJson,
        err
    };
}
const checkLoginMessage = (parsed, socket): {user:User,isJson:Boolean}=>{
    let user;
    let isJson;
    if (parsed && parsed.type && parsed.type === MessageTypes.login && parsed.action === ActionTypes.post && parsed.payload && parsed.payload.userName) {
        let userInfo = parsed.payload.userName;
        isJson = true;
        user = User.getUserByName(userInfo);
        if(!user){
            user = User.createUser(userInfo, socket)
        }
    }
    return {user,isJson};
}
const handleIdentityChunk = (chunk, socket): identityReturn => {
    //if json, try parse as login message or try again, else interpret non-json as user name;
    let parsed
    let userInfo;
    let user;
    let isJson;
    let err;

    try {
        parsed = JSON.parse(chunk);
        ({ user, isJson } = checkLoginMessage(parsed, socket));
        //if initial message is not json then it is interpreted as a name
    } catch (error) {
        userInfo = chunk.toString("utf8");

        if (userInfo && userInfo.length > 0) {
            user = User.createUser(userInfo, socket);
            isJson = false;
        }else{
            err = true;
        }
        console.log("handle identity chunk not json", { err, chunk, userInfo });

    }
    return {
        user,
        isJson,
        err
    }
}
