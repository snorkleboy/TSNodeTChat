import { RequestTypeActionToHandlerMap} from "../../lib/messages/messageTypeExport";
import { MessageTypes, ActionTypes, DestinationTypes } from "../../lib/messages/message";
import { TextMessagePostResponse, ChannelPostResponse, ChannelGetResponse } from "../../lib/messages/messages";
import { Channel } from "../../lib/store/channel/channel";
import { Store } from "../../lib/store/store";
export const requestTypeActionHandlerMap: RequestTypeActionToHandlerMap = {
    [MessageTypes.WRTCAV]:{
        [ActionTypes.offer]: (message, store, user)=>{
            const channel = user.channels.getByName(message.payload.channel);
            if(channel){
                channel.forEachUser(u=>u.writeToAllSockets(message))
            }
        },
        [ActionTypes.meta]: (message, store, user)=>{
            const channel = user.channels.getByName(message.payload.channel);
            if(channel){
                channel.forEachUser(u=>u.writeToAllSockets(message))
            }
        }
    },
    [MessageTypes.textMessage]: {
        [ActionTypes.post]: (message, store, user) => {
            const { destination, body } = message.payload;
            if (destination.type === DestinationTypes.singleUser) {
                console.error("not implimented", { message });
            } else if (destination.type === DestinationTypes.channel) {
                const channel = user.channels.getByName(destination.val);
                if (channel) {
                    channel.forEachUser(u =>u.writeToAllSockets(
                        new TextMessagePostResponse(message,user)
                    ));
                } else {
                    console.error("requested message to channel the user is not in", { message, user:user.username });
                };
            }
        },
    },
    [MessageTypes.channelCommand]: {
        [ActionTypes.post]: (message, store, user) => {
            console.log("hi cc");
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

}
