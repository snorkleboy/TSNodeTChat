import { StreamAwaiter, StreamChecker } from "./streamAwaiter"
import { MessageLike, MessageTypes, ActionTypes } from "../../lib/messages/message";
import { TextMessagePostRequest, TextMessagePostResponse, ChannelPostRequest, ChannelPostResponse, WebRTCOfferStreamResponse, UserPostResponse, ChannelLeaveResponse, WebRTCAnswerOffer, WebRTCDWSStreamFrameResponse, UserPostRequest, WebRTCOfferStream } from "../../lib/messages/messages";
import { RequestTypeActionHandlerMapType} from "../../lib/messages/messageTypeExport";
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
                client.config.videos.onVideoOfferedToThis(msg)
            },
            [ActionTypes.post]:(msg)=>{
                client.config.videos.onDWSVideo(msg);
            }
        },

    })
}

export class ApiClient{
    streamAwaiter: StreamAwaiter<MessageLike>;
    session = {
        username:null,
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
                onDWSVideo:(m:WebRTCDWSStreamFrameResponse)=>any,
                onVideoOfferedToThis: (m:WebRTCOfferStreamResponse)=>any
            },
            responseHandler?: responseHandler
        },

    ){
        this.streamAwaiter = new StreamAwaiter();
        if(!config.responseHandler){
            this.config.responseHandler = ResponseHandler(this);
        }
    }
    receiveFromServer = (msg)=>{
        if (!this.streamAwaiter.onData(msg)) {
            this.onMessage(msg)
        }
    }
    // start = (username:string) => { 
        // return this.authenticate(username);
    // }
    authenticate = (userName: string, sendauth = null) => this.writeToHost(
        new UserPostRequest({userName}),
        (m:UserPostResponse)=>(
            logr("api cleint auth check msg", {
                m, b: (m.type === MessageTypes.login &&
                    m.action === ActionTypes.post,
                    !!m.payload.channels)}
            )&&
            m.type === MessageTypes.login &&
            m.action === ActionTypes.post,
            !!m.payload.channels
        ),
        sendauth
    ).then((m: UserPostResponse)=>{
        console.log("api client auth",{m});
        this.session.username = userName;
        return m
    })
    protected onMessage = (msg:MessageLike)=>{
        this.config.responseHandler[msg.type][msg.action](msg,{username:this.session.username});
    }
    protected writeToHost =(msg:MessageLike, waitFor:StreamChecker<MessageLike>=null,send=null):Promise<MessageLike>=>{
        (send||this.config.hostIO.write)(msg)
        if (waitFor){
            return this.streamAwaiter.waitFor(waitFor)
        }else{
            return Promise.resolve(null);
        }
    }
    offerVideo = (users)=>{
        console.warn("not implemented");
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
    );

}


const logr = (...args)=>{console.log(...args); return true};