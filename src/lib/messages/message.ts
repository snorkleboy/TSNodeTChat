
export enum ActionTypes {
    post = "POST",
    patch = "PATCH",
    get = "GET",
    delete = "DELETE",
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
export interface MessageLike {
    type: MessageTypes,
    action: ActionTypes
}
export interface Request{
    type: MessageTypes
    action: ActionTypes 
    payload: any
}
export abstract class Response<Req extends Request>{
    constructor(req:Req){
        this.type = req.type
    }
    type: Req["type"];
    action: Req["action"]
    isResponse:boolean = true;
}
