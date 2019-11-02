
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
    singleUser = "SINGLE_CHANNELUSER",
    server = "SERVER"
}
export interface MessageLike {
    type: MessageTypes,
    action: ActionTypes
    payload:any
    destination:Destination
}
export interface Request extends MessageLike{
    type: MessageTypes
    action: ActionTypes 
    payload: any,
    destination: Destination
}
export type Destination = {
    type: DestinationTypes,
    val?: string
}
export abstract class Response<Req extends Request> implements MessageLike{
    constructor(req:Req){
        this.type = req.type
        this.action = req.action;
        this.destination = req.destination
    }
    type: Req["type"];
    action: Req["action"]
    destination: Destination
    isResponse:boolean = true;
    payload: any
}
