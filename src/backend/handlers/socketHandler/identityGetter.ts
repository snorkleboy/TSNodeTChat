import { MessageTypes, ActionTypes } from "../../../lib/messages/message";
import { UserPostResponse } from "../../../lib/messages/messages";
import { SocketWrapper, Store } from "../../../lib/store/store";
import { User } from "../../../lib/store/user/user";

import { getNextMessage} from "../../util/getNextMessage"
//at this point the socket is 'confired' not HTTP, but it may be a full json client or a 'barecleint' like telnet or netcat.
//if an http message took longer than 500ms than it may be routed here
// if it takes longer than 10000ms for any message to come through this will bail out
export async function IdentityGetter(socket: SocketWrapper, store: Store): Promise < {
    user: User,
    isJson: Boolean
} > {
    const endCB = () => {
        console.log('Closing connection with the client before Identity')
    }
    const errorCB = err => console.log(`Error before identity: ${err}`)
    socket.socket.on('end', endCB);
    socket.socket.on('error', errorCB);

    let err;
    let startTime = Date.now();
    let user;
    let isJson;
    console.log("IdentityGetter try");
    while (!user && !err) {
        const chunk = await getNextMessage(socket.socket,10000)
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
        isJson
    };
}
const handleIdentityChunk = (chunk, socket) => {
    //if json, try parse as login message or try again, else interpret non-json as user name;
    let parsed
    let userInfo;
    let user;
    let isJson;
    try {
        parsed = JSON.parse(chunk);
        //if initial message is not json then it is interpreted as a name
    } catch (error) {
        userInfo = chunk.toString("utf8");
        if (userInfo && userInfo.length > 0) {
            user = User.createUser(userInfo, socket);
            isJson = false;
        } else {
            // try again
        }

    }
    if (parsed && parsed.type && parsed.type === MessageTypes.login && parsed.action === ActionTypes.post && parsed.payload && parsed.payload.userName) {
        userInfo = parsed.payload.userName;
        isJson = true;
        user = User.createUser(userInfo, socket)
            .addChannel(Store.defaultChannel);
        socket.write(JSON.stringify(new UserPostResponse(parsed, user)))
    } else {
        //try again;
    }

    return {
        user,
        isJson
    }
}