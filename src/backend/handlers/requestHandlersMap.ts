import { RequestTypeActionToHandlerMap} from "../../lib/messages/messageTypeExport";
import { MessageTypes, ActionTypes, DestinationTypes, Destination, MessageLike } from "../../lib/messages/message";
import { TextMessagePostResponse, ChannelPostResponse, ChannelGetResponse } from "../../lib/messages/messages";
import { Channel } from "../../lib/store/channel/channel";
import { Store } from "../../lib/store/store";

const isSingleUser = (d:DestinationTypes):d is DestinationTypes.singleUser=>(d as DestinationTypes.singleUser) === DestinationTypes.singleUser
const handler = (d:MessageLike,singleUser,channelBroadCast)=>{
    if (isSingleUser(d.destination.type)){
        return singleUser();
    }else{
        return channelBroadCast();
    }
}

export const requestTypeActionHandlerMap: RequestTypeActionToHandlerMap = {
    [MessageTypes.textMessage]: {
        [ActionTypes.post]: (message, store, user) => handler(message,()=>{
            console.error("not implimented", { message });
        },()=>{
            const destination = message.destination;
            if (destination.type === DestinationTypes.singleUser) {
            } else if (destination.type === DestinationTypes.channel) {
                const channel = user.channels.getByName(destination.val);
                if (channel) {
                    channel.forEachUser(u => u.writeToAllSockets(
                        new TextMessagePostResponse(message, user)
                    ));
                } else {
                    console.error("requested message to channel the user is not in", { message, user: user.username });
                };
            }
        })
    },
    [MessageTypes.channelCommand]: {
        [ActionTypes.post]: (message, store, user) => {
            const { channelName, switchTo } = message.payload;
            if (switchTo) {
                user.channels.forEach(channel => channel.removeUser(user));
            }
            const {channel,isNew} = Channel.getOrCreateChannel(channelName);
            const res = new ChannelPostResponse(message, user);
            channel.addUser(user);
            if (isNew){
                res.payload.isNew = true;
                Store.getStore().users.forEach(u => u.writeToAllSockets(res))
            }else{
                channel.forEachUser(u => u.writeToAllSockets(res))
            }
        },
        [ActionTypes.get]: (message, store, user) => {
            user.writeToAllSockets(new ChannelGetResponse(message,user));
        }
    },
    [MessageTypes.WRTCAV]: {
        [ActionTypes.offer]: (message, store, user) => {
            const channel = user.channels.getByName(message.payload.channel);
            if (channel) {
                channel.forEachUser(u => u.writeToAllSockets(message))
            }
        },
        [ActionTypes.meta]: (message, store, user) => {
            const channel = user.channels.getByName(message.payload.channel);
            if (channel) {
                channel.forEachUser(u => u.writeToAllSockets(message))
            }
        }
    }
}