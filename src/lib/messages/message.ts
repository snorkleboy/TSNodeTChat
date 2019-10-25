
export enum ActionTypes{
    post = "POST",
    patch = "PATCH",
    get = "GET",
    delete = "DELETE",
    offer = "OFFER",
    meta = "META"
}
export enum MessageTypes {
    textMessage = "TEXT_MESSAGE",
    channelCommand = "CHANNEL_COMMAND",
    login = "LOGIN",
    WRTCAV = "WebRTCAV"
}
export enum DestinationTypes {
    channel = "CHANNEL",
    singleUser = "SINGLEUSER"
}
export interface MessageLike {
    type: MessageTypes,
    action: ActionTypes
    payload:any
}
export interface Request extends MessageLike{
    type: MessageTypes
    action: ActionTypes 
    payload: any
}
export abstract class Response<Req extends Request> implements MessageLike{
    constructor(req:Req){
        this.type = req.type
        this.action = req.action;
    }
    type: Req["type"];
    action: Req["action"]
    isResponse:boolean = true;
    payload: any
}
