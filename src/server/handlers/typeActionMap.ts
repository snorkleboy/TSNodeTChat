import { MessageTypes, HandledMessages, ActionTypes, DestinationTypes, Message } from "../../messages/message";
import { Channel } from "../store/channel";
import { newLineArt } from "../../util/newline";
import { Store } from "../store/store";
import { User } from "../store/user";
import { SocketWrapper } from "../store/socket";
import { MessageHandler, MessageHandlerGen } from "./messageHandler";
export type TypeMapper<T extends { type: string }> = {
    [Type in T["type"]]: T extends { type: Type } ? T : never
}

type MessageActionHandlerMap<M extends HandledMessages> = {
    [messageType in M["type"]]: {
        [actionType in TypeMapper<M>[messageType]['action']]: M extends { action: actionType, type: messageType } ?
        MessageHandlerGen<M>
        :
        never
    }
};

type MessageActionHandlerResolver = MessageActionHandlerMap<HandledMessages>;
export const messageActionHandlerResolver: MessageActionHandlerResolver = {
    [MessageTypes.textMessage]: {
        [ActionTypes.post]: (message, store, user) => {
            const { destination, body } = message.payload;
            if (destination.type === DestinationTypes.singleUser) {
                console.error("not implimented", { message });
            } else if (destination.type === DestinationTypes.channel) {
                const channel = user.channels.getByName(destination.val);
                if (channel) {
                    channel.forEachUser(u => u.id !== user.id && u.writeToAllSockets(`${newLineArt(user.username, channel.name)}${body}`));
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