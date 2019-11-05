import { requestTypeActionHandlerMap } from "./requestHandlersMap";
import { MessageHandler } from "../../lib/messages/messageTypeExport";
import { HandledRequests } from "../../lib/messages/messages";
import { Store } from "../../lib/store/store";
import { User } from "../../lib/store/user/user";

export const messageHandler: MessageHandler= (message: HandledRequests, user: User) =>{
    try {
        return requestTypeActionHandlerMap[message.type][message.action](message, user);
    } catch (error) {
        console.error({ error, message})
    }
}