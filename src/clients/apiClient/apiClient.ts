import { StreamAwaiter, StreamChecker } from "./streamAwaiter"
import { MessageLike, MessageTypes, ActionTypes } from "../../lib/messages/message";
import { TextMessagePostRequest, TextMessagePostResponse, ChannelPostRequest, ChannelPostResponse, WebRTCOfferStreamResponse, UserPostResponse, ChannelLeaveResponse, WebRTCAnswerOffer, WebRTCDWSStreamFrameResponse, UserPostRequest, WebRTCOfferStream, WebRTCIceCandidate } from "../../lib/messages/messages";
import { RequestTypeActionHandlerMapType} from "../../lib/messages/messageTypeExport";
import { RTCClientManager } from "../webReact/rtcHandler";
type responseHandler = RequestTypeActionHandlerMapType<
    TextMessagePostResponse|
    ChannelPostResponse|
    ChannelLeaveResponse|
    WebRTCOfferStreamResponse|
    WebRTCDWSStreamFrameResponse
>

const ResponseHandler = (client: ApiClient): responseHandler=>{
    return ({
        [MessageTypes.textMessage]:{
            [ActionTypes.post]:(message)=>{
                client.config.messages.onMessage(message);
            }
        },
        [MessageTypes.channelCommand]:{
            [ActionTypes.post]: (message)=>{
                client.config.channels.onNewChannel(message);
            },
            [ActionTypes.patch]: (msg)=>{
                client.config.channels.onChannelUsersChanged(msg)
            }
        },
        [MessageTypes.WRTCAV]:{
            [ActionTypes.offer]:(msg)=>{
                (
                    client.config.videos?.dwsVideo?.onVideoOfferedToThis 
                    ?? (()=>console.warn("offer not implimented",{msg,client}))
                )(msg)
            },
            [ActionTypes.post]:(msg)=>{
                (
                    client.config.videos?.dwsVideo?.onDWSVideo 
                    ?? (() => console.log("not implimented", { msg, client}))
                )(msg)
            },
        },

    })
}

export class ApiClient{
    webRTCManager: RTCClientManager
    session = {
        username:null,
        channelName:null
    }
    constructor(
        public config:{
            hostIO: { write: (msg: MessageLike) => any },
            channels: {
                onNewChannel:(m:ChannelPostResponse)=>any,
                onChannelUsersChanged:(m:ChannelLeaveResponse)=>any
            },
            messages: {
                onMessage:(m:TextMessagePostResponse)=>any
            },
            videos: {
                dwsVideo?:{
                    onDWSVideo?: (m: WebRTCDWSStreamFrameResponse) => any,
                    onVideoOfferedToThis?: (m: WebRTCOfferStreamResponse) => any,
                }
                webRTC?:{
                    getStream: () => Promise<{ ref: any, stream: any }>,
                    onTrack: (e: any, partnerName: string) => any
                }
            },
            responseHandler?: responseHandler,
            
        },
        public streamAwaiter = new StreamAwaiter<MessageLike>()

    ){
        if(config.videos.dwsVideo && config.videos.webRTC){
            console.warn("should only have one video type config");
        }
        if(!config.responseHandler){
            this.config.responseHandler = ResponseHandler(this);
        }

    }
    receiveFromServer = (msg)=>{
        console.log("recieve",{msg});
        if (!this.streamAwaiter.onData(msg)) {
            this.onMessage(msg)
        }
    }
    authenticate = (userName: string, sendauth = null) => this.writeToHost(
        new UserPostRequest({userName}),
        (m:UserPostResponse)=>(
            m.type === MessageTypes.login &&
            m.action === ActionTypes.post,
            !!m.payload.channels
        ),
        sendauth
    ).then((m: UserPostResponse)=>{
        this.session.username = userName;
        this.session.channelName = m.payload.channels[0].name;
        if(this.config.videos.webRTC){
            this.webRTCManager = this.webRTCManager || new RTCClientManager(
                this.session.username,
                () => this.session.channelName,
                this.streamAwaiter,
                this.config.videos.webRTC.getStream,
                this.writeToHost,
                this.config.videos.webRTC.onTrack
            )
        }
        return m
    })
    protected onMessage = (msg:MessageLike)=>{
        const handler = this.config.responseHandler?.[msg.type]?.[msg.action] ?? (() => { });//console.warn("not handled message",{msg})
        handler(msg, { username: this.session.username })
    }
    protected writeToHost =(msg:MessageLike, waitFor:StreamChecker<MessageLike>=null,send=null):Promise<MessageLike>=>{
        (send||this.config.hostIO.write)(msg)
        if (waitFor){
            return this.streamAwaiter.waitFor(waitFor);
        }else{
            return Promise.resolve(null);
        }
    }
    offerVideo = (users)=>{
        if(this.config.videos.webRTC){
            if(this.session.username && this.session.channelName){
                this.webRTCManager.broadCastOffer(users);
            }else{
                console.error("must authenticate before offering video");
            }
        }else{
            console.error("need webrtc config to offer video");
        }
    }
    sendTextMessage = (body: string, channel: string) => this.writeToHost(
        new TextMessagePostRequest(body, channel),
        (m:TextMessagePostResponse)=>(
            m.type === MessageTypes.textMessage &&
            m.action === ActionTypes.post &&
            m.payload.body &&
            m.payload.from === this.session.username
        ));
    
    createChannel = (channelName) => this.writeToHost(
        new ChannelPostRequest({channelName,switchTo:true}),
        (m: ChannelPostResponse) =>(
            m.type === MessageTypes.channelCommand,
            m.action === ActionTypes.post,
            m.payload.channelName == channelName,
            m.payload.userThatJoined === this.session.username
        )
    ).then((m: ChannelPostResponse)=>{
        this.session.channelName = m.payload.channelName
        return m;
    });

}


const logr = (...args)=>{console.log(...args); return true};