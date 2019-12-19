import { Request, Response, ActionTypes, DestinationTypes, MessageTypes, Destination, EchoResponse, ServerDestination, SingleUserDestination, ChannelDestination } from "./message";

import { User } from "../store/user/user";
import { Store } from "../store/store";
import { Channel } from "../store/channel/channel";

const isChannelPostResponse = (msg: HandledResponses | UserPostResponse) => !!(msg as ChannelPostResponse).payload.userThatJoined
const isChannelLeaveResponse = (msg: HandledResponses | UserPostResponse): msg is ChannelLeaveResponse => msg.type === MessageTypes.channelCommand && msg.action === ActionTypes.patch && !!msg.payload.channelLeft
const isLoginResponse = (msg: HandledResponses | UserPostResponse): msg is UserPostResponse => !!((msg as UserPostResponse).payload.userName);

const isResponseTo = (req: HandledRequests | UserPostRequest, res: HandledResponses | UserPostResponse, otherCheck: (r: HandledResponses | UserPostResponse) => boolean) => !!(otherCheck(res) && res.type === req.type && res.action === req.action);
const isTextResponse = (msg: HandledResponses | UserPostResponse): msg is TextMessagePostResponse => !!(msg as TextMessagePostResponse).payload.body


export type HandledRequests =
    | TextMessagePostRequest
    | ChannelPostRequest
    | ChannelGetRequest
    | WebRTCIceCandidate
    | WebRTCOfferStream
    | WebRTCAnswerOffer
    | WebRTCDWSStreamFrame
    // | WebRTCRenegotiateStream

export type HandledResponses = TextMessagePostResponse 
    | ChannelPostResponse 
    | ChannelGetResponse
    | WebRTCOfferStreamResponse
    // | WebRTCRenegotiateResponse
    | WebRTCAnswerOfferResponse
    | ChannelLeaveResponse
;
export class TextMessagePostRequest implements Request {
    type: MessageTypes.textMessage = MessageTypes.textMessage
    action: ActionTypes.post = ActionTypes.post
    constructor(body:string,channel:string,
        public payload= {
            body
        }, 
        public destination: Destination = {
            type:DestinationTypes.channel,
            val:{channel}
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
            switchTo?: boolean,
        }, 
        public destination: Destination = {type:DestinationTypes.channel,val:{channel:payload.channelName}}
    ) { }
}

export class ChannelPostResponse extends Response<ChannelPostRequest> {
    constructor(msg: ChannelPostRequest, user: User,channel:Channel,isNew=false,public payload = {
        channelName: msg.payload.channelName,
        userThatJoined: user.username,
        channelUsers:channel.users.toList().map(u=>u.username),
        isNew,
    }) { super(msg) }
}
export class ChannelLeaveRequest implements Request {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.patch = ActionTypes.patch
    constructor(
        public payload: {
            channelToLeave:string
        },
        public destination: Destination = ServerDestination,
    ) { }
};
export class ChannelLeaveResponse extends Response<ChannelLeaveRequest> {
    constructor(msg: ChannelLeaveRequest, user: User,channel:Channel,
        public payload = {
            user: { username: user.username},
            channelLeft: msg.payload.channelToLeave,
            channelUsers:channel.users.toList().map(u=>u.username)
        }
    ) { super(msg) }
}
export class ChannelGetRequest implements Request {
    type: MessageTypes.channelCommand = MessageTypes.channelCommand
    action: ActionTypes.get = ActionTypes.get
    constructor(
        public payload = undefined,
        public destination: Destination = ServerDestination
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
        from:string
    }, 
    channel,
    user,
    public destination: Destination={
        type:DestinationTypes.singleUser,
        val:{
            channel,user
        }
    }) { }
}

// export class WebRTCRenegotiateStream implements Request {
//     type: MessageTypes.WRTCAV = MessageTypes.WRTCAV
//     action: ActionTypes.patch = ActionTypes.patch
//     constructor(
//         public payload: {
//             description: any,
//             from: string
//         },
//         channel,
//         otherUser:string,
//             public destination: Destination = {
//                 type:DestinationTypes.singleUser,
//                 val: { user: otherUser, channel}
//             }
//     ){}
// }
// export class WebRTCRenegotiateResponse extends EchoResponse<WebRTCRenegotiateStream>{ }
enum StreamTransportTypes {
    rtc,
    ws
}
export class WebRTCDWSStreamFrame implements Request{
    type: MessageTypes.WRTCAV = MessageTypes.WRTCAV
    action: ActionTypes.post = ActionTypes.post
    constructor(msg:WebRTCAnswerOfferResponse,public payload: {
        video: any,
        from: string,
    },
    public destination: SingleUserDestination={
        type:DestinationTypes.singleUser,
        val: { channel: msg.destination.val.channel,user:msg.payload.answerFrom}
    }) { }
}
export class WebRTCDWSStreamFrameResponse extends EchoResponse<WebRTCDWSStreamFrame>{ }

export class WebRTCOfferStream implements Request {
    type: MessageTypes.WRTCAV = MessageTypes.WRTCAV
    action: ActionTypes.offer = ActionTypes.offer
    constructor(public payload: {
        description: any,
        directWS?: boolean,
        from: string,
        // renegotation?:{
        //     to:string,
        // }
    },
        public destination: SingleUserDestination | ChannelDestination) { }
}
export class WebRTCOfferStreamResponse extends EchoResponse<WebRTCOfferStream>{ }
export class WebRTCAnswerOffer implements Request {
    type: MessageTypes.WRTCAV = MessageTypes.WRTCAV
    action: ActionTypes.offer = ActionTypes.offer
    constructor(msg: WebRTCOfferStreamResponse, user:{username:string},desc: any,directWS:Boolean=false, 
        public payload = {
            description: desc,
            originalOfferFrom:msg.payload.from,
            answerFrom:user.username,
            directWS,
        },
        public destination = {
            type:DestinationTypes.singleUser,
            val:{user:msg.payload.from,channel:msg.destination.val.channel}
        }
    ) {}
}
export class WebRTCAnswerOfferResponse extends EchoResponse<WebRTCAnswerOffer>{ }

export class UserPostRequest implements Request {
    type: MessageTypes.login = MessageTypes.login
    action: ActionTypes.post = ActionTypes.post
    constructor(public payload: {
        userName: string,
    },
    public destination: Destination = ServerDestination) { }
}

export class UserPostResponse extends Response<UserPostRequest> {
    constructor(msg: UserPostRequest, user: User, public payload = {
        userName: msg.payload.userName,
        channels: user.channels.getList().map((c) => ({ name:c.name, id:c.id,users:c.getUserList().map(u=>u.username) }))
    }) { super(msg) }
}