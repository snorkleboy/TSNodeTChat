import { Request, Response,ActionTypes,DestinationTypes,MessageTypes, Destination} from "./message";
import { User } from "../store/user/user";
import { Store } from "../store/store";
export type HandledRequests =
    | TextMessagePostRequest
    | ChannelPostRequest
    | ChannelGetRequest
    | WebRTCIceCandidate
    | WebRTCOfferStream

export type HandledResponses = TextMessagePostResponse | ChannelPostResponse | WebRTCAnswerStream;
const serverDestination = { type: DestinationTypes.server }

export class TextMessagePostRequest implements Request {
    type: MessageTypes.textMessage = MessageTypes.textMessage
    action: ActionTypes.post = ActionTypes.post
    constructor(body:string,channel:string,
        public payload= {
            body
        }, 
        public destination: Destination = {
            type:DestinationTypes.channel,
            val:channel
        }
    ) { }
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
    constructor(
        public payload: {
            channelName: string,
            switchTo: boolean
        }, 
        public destination: Destination = serverDestination
    ) { }
}
export class ChannelPostResponse extends Response<ChannelPostRequest> {
    constructor(msg: ChannelPostRequest, user: User, public payload = {
        channelName: msg.payload.channelName,
        userThatJoined: user.username,
        isNew:false
    }) { super(msg) }
}
export class ChannelGetRequest implements Request {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.get = ActionTypes.get
    constructor(
        public payload = undefined,
        public destination: Destination = serverDestination
    ) { }
}

export class ChannelGetResponse extends Response<ChannelGetRequest> {
    constructor(msg: ChannelGetRequest, user: User, public payload = {
        channels: Store.getStore().channels.getList()
    }) { super(msg) }
}


export class WebRTCIceCandidate implements Request {
    type: MessageTypes.WRTCAV = MessageTypes.WRTCAV
    action: ActionTypes.meta = ActionTypes.meta
    constructor(public payload: {
        candidate: any,
        channel:string,
        to:string,
        from:string
    }, 
    public destination: Destination) { }
}
export class WebRTCOfferStream implements Request{
    type: MessageTypes.WRTCAV = MessageTypes.WRTCAV
    action: ActionTypes.offer = ActionTypes.offer
    constructor(public payload : {
        channel:string,
        description:any,
        from:string,
        renegotation?:{
            to:string,
        }
    },
    public destination: Destination) { }
}
export class WebRTCAnswerStream extends Response<WebRTCOfferStream> {
    constructor(msg: WebRTCOfferStream, user:{username:string},desc: any, public payload = {
        description: desc,
        channel: msg.payload.channel,
        offerFrom:msg.payload.from,
        answerFrom:user.username
    }) { super(msg) }
}

export class UserPostRequest implements Request {
    type: MessageTypes.login = MessageTypes.login
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        userName: string,
    },
    public destination: Destination = serverDestination) { }
}

export class UserPostResponse extends Response<UserPostRequest> {
    constructor(msg: UserPostRequest, user: User, public payload = {
        userName: msg.payload.userName,
        channels: user.channels.getList().map(({ name, id }) => ({ name, id }))
    }) { super(msg) }
}