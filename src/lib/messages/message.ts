import { request } from "https";

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
export interface Destination {
    type: DestinationTypes
    val: SingleUserDestination['val'] | ChannelDestination['val'] | null
}
export interface SingleUserDestination extends Destination {
    type: DestinationTypes.singleUser,
    val: {
        user: string,
        channel:string
    }
}
export const ServerDestination: Destination =  {
    type: DestinationTypes.singleUser,
    val: null
}
export interface ChannelDestination extends Destination {
    type: DestinationTypes.channel,
    val: {
        channel: string
    }
}
export abstract class Response<Req extends Request> implements MessageLike{
    constructor(req:Req, 
        public type:Req['type'] = req.type,
        public action:Req['action'] = req.action,
        public destination = req.destination
    ){}
    isResponse:boolean = true;
    payload: any
}
export class EchoResponse<T extends Request> extends Response<T>{
    constructor(req: T,public payload:T['payload'] = req.payload) {
        super(req);
    }
}
