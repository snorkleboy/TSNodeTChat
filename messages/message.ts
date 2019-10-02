
export enum ActionTypes {
    post = "POST"
}
export enum DestinationTypes{
    channel="CHANNEL",
    singleUser="SINGLEUSER"
}
export interface IChannelCommandPayload{
    channel:number
}

export enum MessageTypes {
    textMessage = "TEXT_MESSAGE",
    channelCommand = "CHANNEL_COMMAND"
}

type concretePayload = 
    | TextMessagePayload
    | TextMessagePayloadPost
    | IChannelCommandPayload;
export abstract class Message {
    type: MessageTypes
    action: ActionTypes
    payload: concretePayload
}


export abstract class TextMessagePayload {
    body: string
    from: string
}
export abstract class TextMessagePayloadPost extends TextMessagePayload {
    destination: {
        type: DestinationTypes,
        val: number
    }
}
export class PostTextMessageRequest implements Message{
    type = MessageTypes.textMessage
    action= ActionTypes.post
    constructor(public payload :TextMessagePayloadPost) {}
}
export class NewTextMessageResponse implements Message{
    type = MessageTypes.textMessage
    action = ActionTypes.post
    constructor(public payload: TextMessagePayload) { }
}