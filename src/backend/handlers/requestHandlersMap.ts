import { RequestTypeActionResolver} from "../../lib/messages/messageTypeExport";
import { MessageTypes, ActionTypes, DestinationTypes } from "../../lib/messages/message";
import { TextMessagePostResponse, ChannelPostResponse } from "../../lib/messages/messages";
import { Channel } from "../../lib/store/store";
export const requestTypeActionHandlerMap: RequestTypeActionResolver = {
    [MessageTypes.textMessage]: {
        [ActionTypes.post]: (message, store, user) => {
            const { destination, body } = message.payload;
            if (destination.type === DestinationTypes.singleUser) {
                console.error("not implimented", { message });
            } else if (destination.type === DestinationTypes.channel) {
                const channel = user.channels.getByName(destination.val);
                if (channel) {
                    channel.forEachUser(u =>u.writeToAllSockets(
                        JSON.stringify(new TextMessagePostResponse(message,user))
                    ));
                } else {
                    console.error("requested message to channel the user is not in", { message, user });
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
            const channel = Channel.getOrCreateChannel(channelName);
            channel.addUser(user);
            channel.forEachUser(u => u.writeToAllSockets(JSON.stringify(new ChannelPostResponse(message,user))))
        },
        [ActionTypes.get]: (message, store, user) => {
            user.writeToAllSockets(JSON.stringify(store.channels.store))
        }
    },

}
