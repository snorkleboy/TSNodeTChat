import { HandledMessages, Message } from "../../messages/message";
import { Store } from "../store/store";
import { User } from "../store/user";
import { SocketWrapper } from "../store/socket";
import { messageActionHandlerResolver } from "./typeActionMap";
export type MessageHandlerGen<M extends HandledMessages> = (message: M, store: Store, user: User)=> void ;
export type MessageHandler = MessageHandlerGen<HandledMessages>
export const messageHandler: MessageHandler= (message: HandledMessages, store: Store, user: User) =>{
    console.log("reveived message",user.username,message)
    try {
        return messageActionHandlerResolver[message.type][message.action](message, store, user);;
    } catch (error) {
        console.error({ error, message})
    }
}