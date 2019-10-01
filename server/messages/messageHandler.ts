import { match,when } from "../util/switchExp";
import { Sockets } from "../sockets/sockets";
import { MessageTypes, IMessage } from "./message";

export const messageHandler = (message: IMessage,sockets:Sockets) => match(message.type,
    when(MessageTypes.channelCommand, ()=> { console.log("hi"); return "hello" }),
    when(MessageTypes.textMessage, () => { console.log("hi"); return "hello" })
);
