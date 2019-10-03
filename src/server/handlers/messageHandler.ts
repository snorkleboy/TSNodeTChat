import { Store } from "../store/store";
import { MessageTypes, HandledMessages,  ActionTypes, DestinationTypes } from "../../messages/message";
import { User } from "../store/user";
import { SocketWrapper } from "../store/socket";
import { Channel } from "../store/channel";
import { newLineArt } from "../../util/newline";

export interface MessageHandler<M,T> { (message: M, store: Store, user: User, thisSocket: SocketWrapper): T };



type TypesToMessageGeneric<U> = {
    [actionType in HandledMessages["type"]]: U extends { type: actionType } ? U:never
}
type typeToMessage = TypesToMessageGeneric<HandledMessages>;

type MessageActionHandlerMapGeneric<Handled>={
    [messageType in HandledMessages["type"]]: {
        [actionType in typeToMessage[messageType]['action']]: Handled extends { action: actionType, type: messageType } ? 
            MessageHandler<Handled,void> 
        : 
            never
    } 
};
type MessageActionHandlerMap = MessageActionHandlerMapGeneric<HandledMessages>;
const MessageActionHandlerMap: MessageActionHandlerMap= {
    [MessageTypes.textMessage]: {
        [ActionTypes.post]: (message, store, user, socket) => {
            const {destination,body} = message.payload;
            if(destination.type === DestinationTypes.singleUser){
                console.error("not implimented",{message});
            } else if (destination.type === DestinationTypes.channel) {
                const channel = user.channels.getByName(destination.val);
                if (channel){
                    channel.forEachUser(u => u.id !== user.id && u.writeToAllSockets(`${newLineArt(user.username,channel.name)}${body}`));
                }else{
                    console.error("requested message to channel the user is not in",{message,user});
                }
            }
        },
    },
    [MessageTypes.channelCommand]:{
        [ActionTypes.post]:(message,store,user,socket)=>{
            console.log("hi cc"); 
            const { channelName, switchTo } = message.payload;
            if (switchTo){
                user.channels.forEach(channel => channel.removeUser(user));
            }
            const channel = Channel.getOrCreateChannel(channelName);
            channel.addUser(user);
            channel.forEachUser(u=>u.writeToAllSockets("new user " + user.username))
        },
        [ActionTypes.get]: (message, store, user, socket) => {
            user.writeToAllSockets(JSON.stringify(store.channels.store))
        }
    },

}
export const messageHandler = (message: HandledMessages, store: Store, user: User, thisSocket: SocketWrapper) =>{
    console.log("reveived message",user.username,message)
    try {
        return MessageActionHandlerMap[message.type][message.action](message, store, user, thisSocket);;
    } catch (error) {
        console.error({ error, message})
    }
}