import { Store } from "../store/store";
import { MessageTypes, HandledMessages,  ActionTypes, DestinationTypes, Message } from "../../messages/message";
import { User } from "../store/user";
import { SocketWrapper } from "../store/socket";
import { Channel } from "../store/channel";
import { newLineArt } from "../../util/newline";
export type TypeMapper<T extends { type: string }> = {
    [Type in T["type"]]: T extends { type: Type } ? T : never
}
export interface MessageHandler<M extends Message> { (message: M, store: Store, user: User, thisSocket: SocketWrapper): void };

type MessageActionHandlerMap<M extends Message>={
    [messageType in M["type"]]: {
        [actionType in TypeMapper<M>[messageType]['action']]: M extends { action: actionType, type: messageType } ?
            MessageHandler<M>
        :
            never
    } 
};

type MessageActionHandlerResolver = MessageActionHandlerMap<HandledMessages>;
const messageActionHandlerResolver: MessageActionHandlerResolver= {
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
        return messageActionHandlerResolver[message.type][message.action](message, store, user, thisSocket);;
    } catch (error) {
        console.error({ error, message})
    }
}