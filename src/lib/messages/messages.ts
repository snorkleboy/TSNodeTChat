import { Request, Response, ActionTypes, DestinationTypes, MessageTypes, Destination, EchoResponse, ServerDestination, SingleUserDestination, ChannelDestination } from "./message";

import { User } from "../store/user/user";
import { Store } from "../store/store";
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
    constructor(msg: ChannelPostRequest, user: User,isNew=false,leftChannel=false, public payload = {
        channelName: msg.payload.channelName,
        userThatJoined: user.username,
        isNew,
        leftChannel
    }) { super(msg) }
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
export class WebRTCDWSStreamResponse extends EchoResponse<WebRTCDWSStreamFrame>{ }

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