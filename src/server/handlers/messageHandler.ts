import { Store } from "../store/store";
import { User } from "../store/user/user";
import { HandledRequests} from "../../messages/messageTypeExport";
import { messageActionHandlerResolver } from "./handlersMap";
export type MessageHandlerGen<M extends HandledRequests> = (message: M, store: Store, user: User)=> void ;
export type MessageHandler = MessageHandlerGen<HandledRequests>




export const messageHandler: MessageHandler= (message: HandledRequests, store: Store, user: User) =>{
    console.log("reveived message",user.username,message)
    try {
        return messageActionHandlerResolver[message.type][message.action](message, store, user);;
    } catch (error) {
        console.error({ error, message})
    }
}