import { MessageTypes, ActionTypes, DestinationTypes } from "../../messages/message";
import { HandledRequests} from "../../messages/messageTypeExport"
import { Channel } from "../store/channel/channel";
import { newLineArt } from "../../util/newline";
import { MessageHandlerGen  } from "./messageHandler";
import { TypeMapper} from "../../util/typeMapper";
export type MessageActionHandlerMap<M extends HandledRequests> = {
    [messageType in M["type"]]: {
        [actionType in TypeMapper<M>[messageType]['action']]: M extends { action: actionType, type: messageType } ?
        MessageHandlerGen<M>
        :
        never
    }
};


type MessageActionHandlerResolver = MessageActionHandlerMap<HandledRequests>;
export const messageActionHandlerResolver: MessageActionHandlerResolver = {
    [MessageTypes.textMessage]: {
        [ActionTypes.post]: (message, store, user) => {
            const { destination, body } = message.payload;
            if (destination.type === DestinationTypes.singleUser) {
                console.error("not implimented", { message });
            } else if (destination.type === DestinationTypes.channel) {
                const channel = user.channels.getByName(destination.val);
                if (channel) {
                    channel.forEachUser(u => u.id !== user.id && u.writeToAllSockets(
                        `${newLineArt(user.username, channel.name)}${body}`
                    ));
                } else {
                    console.error("requested message to channel the user is not in", { message, user });
                }
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
            channel.forEachUser(u => u.writeToAllSockets("new user " + user.username))
        },
        [ActionTypes.get]: (message, store, user) => {
            user.writeToAllSockets(JSON.stringify(store.channels.store))
        }
    },

}