import { Request, Response,ActionTypes,DestinationTypes,MessageTypes} from "./message"
import { User } from "../store";
export type HandledRequests =
    | TextMessagePostRequest
    | ChannelPostRequest
    | ChannelGetRequest
export type HandledResponses = TextMessagePostResponse | ChannelPostResponse;



export class UserPostRequest implements Request {
    type: MessageTypes.login = MessageTypes.login
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        userName: string,
    }) { }
}

export class UserPostResponse extends Response<UserPostRequest> {
    constructor(msg: UserPostRequest,user:User, public payload = {
        userName: msg.payload.userName,
        channels:user.channels.getList().map(({name,id})=>({name,id}))
    }) { super(msg) }
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
    constructor(req: TextMessagePostRequest, user: User, public payload = {
        body: req.payload.body,
        from: {
            name: user.username,
            id: user.id
        }
    }) { super(req); }
}

export class ChannelPostRequest implements Request {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        channelName: string,
        switchTo: boolean
    }) { }
}
export class ChannelPostResponse extends Response<ChannelPostRequest> {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.post = ActionTypes.post
    constructor(msg: ChannelPostRequest, user: User, public payload = {
        channelName: msg.payload.channelName,
        userThatJoined: user.username
    }) { super(msg) }
}
export class ChannelGetRequest implements Request {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.get = ActionTypes.get
    constructor(public payload = undefined) { }
}

