import { MessageHandler } from "../server/handlers/messageHandler";
import { Channel } from "../server/store/channel";

export enum ActionTypes {
    post = "POST",
    patch = "PATCH",
    get = "GET",
    delete = "DELETE"
}
export enum MessageTypes {
    textMessage = "TEXT_MESSAGE",
    channelCommand = "CHANNEL_COMMAND",
    login = "LOGIN"
}
export enum DestinationTypes {
    channel = "CHANNEL",
    singleUser = "SINGLEUSER"
}
export interface Message {
    type: MessageTypes
    action: ActionTypes
    payload: any
}

export class TextMessagePostRequest implements Message {
    type: MessageTypes.textMessage = MessageTypes.textMessage
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        body: string
        destination: {
            type: DestinationTypes,
            val: string
        }
    }) { }

}
export class UserPostRequest implements Message {
    type: MessageTypes.login = MessageTypes.login
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        userName: string,
    }) { }
}



export class ChannelPostRequest implements Message {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        channelName: string,
        switchTo:boolean
    }) { }
}
export class ChannelGetRequest implements Message {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.get = ActionTypes.get
    constructor(public payload = undefined) { }
}
export type HandledMessages =
    | TextMessagePostRequest
    | ChannelPostRequest
    | ChannelGetRequest

