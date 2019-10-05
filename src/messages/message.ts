
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
interface Request {
    type: MessageTypes
    action: ActionTypes 
    payload: any
}
abstract class Response<Req extends Request>{
    constructor(req:Req){
        this.type = req.type
    }
    type: Req["type"];
    action: Req["action"]
    isResponse:boolean = true;
}




export class UserPostRequest implements Request {
    type: MessageTypes.login = MessageTypes.login
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        userName: string,
    }) { }
}
export class TextMessagePostRequest implements Request {
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
export class TextMessagePostResponse extends Response<TextMessagePostRequest> {
    constructor(req: TextMessagePostRequest,public payload: {
        body: string
        from: {
            type: DestinationTypes,
            val: string
        }
    }) {super(req); }
}

export class ChannelPostRequest implements Request {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        channelName: string,
        switchTo:boolean
    }) { }
}
export class ChannelPostResponse extends Response<ChannelPostRequest> {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.post = ActionTypes.post
    constructor(msg:ChannelPostRequest,public payload: {
        channelName: string,
        userThatJoined:string
    }) { super(msg)}
}
export class ChannelGetRequest implements Request {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.get = ActionTypes.get
    constructor(public payload = undefined) { }
}

