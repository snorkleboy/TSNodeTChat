
interface Idestination {

}
enum ActionTypes {

}
interface IPayload {
}
export interface ITextMessagePayload extends IPayload {
    body: string,
    destination: Idestination
}

export enum MessageTypes {
    textMessage = "TEXT_MESSAGE",
    channelCommand = "CHANNEL_COMMAND"
}
export interface IMessage {
    type: MessageTypes,
    action: ActionTypes
    payload: IPayload
    originatingSocketID: Number
}