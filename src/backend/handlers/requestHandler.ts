import { requestTypeActionHandlerMap } from "./requestHandlersMap";
import { MessageHandler } from "../../lib/messages/messageTypeExport";
import { HandledRequests } from "../../lib/messages/messages";
import { Store, User } from "../../lib/store/store";


export const messageHandler: MessageHandler= (message: HandledRequests, store: Store, user: User) =>{
    console.log("reveived message",user.username,message)
    try {
        return requestTypeActionHandlerMap[message.type][message.action](message, store, user);;
    } catch (error) {
        console.error({ error, message})
    }
}