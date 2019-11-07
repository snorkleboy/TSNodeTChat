import * as React from "react";
import * as ReactDOM from "react-dom";
require("./main.css");
import io from 'socket.io-client';
import { Socket } from "socket.io";
import { TextMessagePostRequest, UserPostRequest, HandledResponses, TextMessagePostResponse, UserPostResponse, ChannelPostResponse, HandledRequests, ChannelPostRequest } from "../../lib/messages/messages";
import { DestinationTypes } from "../../lib/messages/message";
import { StreamAwaiter ,StreamChecker} from "../tcpClient/streamAwaiter";
import { websocketMessageEventName } from "../../lib/store/sockets/socket";
import { newLineArt } from "../../lib/util/newline";
import {  RTCClientManager} from "./rtcHandler"

interface VCState {
    localStream: any
    partners: { [k: string]: Partner }
    vcManager: RTCClientManager
}
interface SocketState {
    socket:Socket,
    auth:false,
    channels:Array<string>,
    currentChannel:string,
    channelsObj: { [k: string]: {name:string,users:Array<string>,}},
    currentChannelUsers:[],
    userName:string,
}
interface TypeingState {
    msg:string
}
interface ReceivedMsgs{
    msgs:Array<string>
}
interface Partner{
    videoWebCamRef,
    stream
}
type sendToServer = {
    <Req extends HandledRequests | UserPostRequest, Res extends HandledResponses | UserPostResponse>(
        socket: Socket,
        msg: Req,
        checker?: StreamChecker<Res>,
        timeout?:number
    ): Promise<Res>;
    <Req extends HandledRequests | UserPostRequest, Res extends HandledResponses | UserPostResponse>(
        socket: Socket,
        msg: Req,
        checker?:null|undefined,
                timeout?:number

    ): void
}
const isChannelPostResponse = (msg:HandledResponses|UserPostResponse)=>!!(msg as ChannelPostResponse).payload.userThatJoined
const isLoginResponse = (msg:HandledResponses|UserPostResponse):msg is UserPostResponse=>!!((msg as UserPostResponse).payload.userName);

const isResponseTo = (req: HandledRequests | UserPostRequest, res: HandledResponses | UserPostResponse, otherCheck: (r: HandledResponses | UserPostResponse)=>boolean) => !!(otherCheck(res) && res.type === req.type && res.action === req.action);
const isTextResponse = (msg: HandledResponses | UserPostResponse):msg is TextMessagePostResponse=>!!(msg as TextMessagePostResponse).payload.body
class SocketComponent extends React.Component {
    state: SocketState & TypeingState & ReceivedMsgs & VCState = {
        socket:null,
        msg:"",
        msgs:[],
        channels:[],
        channelsObj: {},
        currentChannelUsers: [],
        currentChannel:null,
        auth:false,
        userName: "wsU " + Date.now()%1000 ,
        vcManager:null,
        localStream:null,
        partners: {},
    }
    videoWebCamRefLoc
    streamAwaiter = new StreamAwaiter();
    constructor(props){
        super(props);
        this.videoWebCamRefLoc = React.createRef();

    }
    sendToServer: sendToServer = (socket, msg, checker = null,timeout=null) => {
        // console.log("sending to server", { msg });
        const str = JSON.stringify(msg);
        socket.emit(websocketMessageEventName, str);
        if (checker) {
            return this.streamAwaiter.waitFor(checker,timeout);
        } else {
            return null
        }
    }
    componentDidMount(){
        const that = this;
        setTimeout(()=>{
            this.configureSocket()
                .then(() => {
                    that.startRTC();
                    document.title = this.state.userName;
                })
                .catch(function (e) {
                    console.log("Something went wrong!", { e });
                });
        })
 
    }
    componentDidUpdate(pp,ps){
        if(ps.partners !== this.state.partners){
            Object.entries(this.state.partners).forEach(([name,obj])=>{
                if(!obj.videoWebCamRef.current.srcObject){
                    obj.videoWebCamRef.current.srcObject = obj.stream;
                    obj.videoWebCamRef.current.play().then(p => console.log("playing", { p })).catch((error) => {
                        console.log({ name,error});
                    });
                }
            })
        }
    }
    configureSocket = ()=>new Promise((r)=>{
        let addr = "localhost";
        addr = "localhost"
        addr = addr + ":3005";
        const socket = io(addr, {
            transports: ['websocket']
        })
        this.setState({ socket });
        socket.on("error",(e)=>{console.log("error",{e})});
        socket.on("connect_error", (e) => { console.log("connect_error", { e }) });
        socket.on("connect_timeout", (e) => { console.log("connect_timeout", { e }) });
        socket.on("reconnect_attempt", (e) => {console.log("reconnect_attempt", new Date().getMinutes(), { e }); this.setState({ auth: false })});
        socket.on("reconnect", (e) => console.log("reconnect"));
        socket.on("reconnecting", (e) => { console.log("reconnecting", new Date().getMinutes(), { e }) });
        socket.on("reconnect_error", (e) => { console.log("reconnect_error",new Date().getMinutes(), { e }) });
        socket.on("reconnect_failed", (e) => { console.log("reconnect_failed", new Date().getMinutes(), { e }) });
        socket.on("dissconnect", (e) => { console.log("dissconnect", { e }) });
        socket.on("connect", (e) => {
            console.log("socket connect");
            this.login(this.state.socket)
            .then(()=>r());
            console.log("connect", { e }) 
        });
        socket.on(websocketMessageEventName, (msg: HandledResponses | UserPostResponse) => {
            if (typeof msg === 'string') {
                try {
                    msg = JSON.parse(msg);
                } catch (error) {
                    console.log('json parse error', { msg, error });
                }
            }
            (msg as any).action !== "META" && console.log("recieved", { msg });
            if (isTextResponse(msg) && msg.payload.from.name !== this.state.userName) {
                this.setState({
                    msgs: [...this.state.msgs, `${newLineArt(msg.payload.from.name, this.state.currentChannel)} ${msg.payload.body}`],
                })
            }
            if (isChannelPostResponse(msg) && (msg as ChannelPostResponse).payload.channelName) {
                msg = msg as ChannelPostResponse;
                let {currentChannelUsers, channelsObj} = this.state
                const channelName = msg.payload.channelName;
                const userThatJoined = msg.payload.userThatJoined;
                const displayName = userThatJoined === this.state.userName? "You":userThatJoined;
                let channels = this.state.channels;
                const userLeftChannel = msg.payload.leftChannel;
                const channelObj = channelsObj[channelName];

                if (!this.state.channelsObj[channelName]){
                    channels= [...this.state.channels, msg.payload.channelName]
                } else if (userThatJoined !== this.state.userName){
                    if (userLeftChannel){
                        currentChannelUsers = (remove(channelObj.users, userThatJoined) as any)
                        if (channelObj) {
                            channelsObj[channelName] = { ...channelObj, users: currentChannelUsers }
                        }
                    }else{
                        currentChannelUsers = ([...channelObj.users, userThatJoined] as any)
                        if (channelObj) {
                            channelsObj[channelName] = { ...channelObj, users: currentChannelUsers }
                        }
                    }

                }
                console.log({ state: this.state, userLeftChannel, userThatJoined, channelObj})
                this.setState({
                    msgs: [...this.state.msgs, `${displayName} ${userLeftChannel?"left":"joined"} ${msg.payload.channelName}`],
                    channels,
                    currentChannelUsers,
                    channelsObj
                })
                

            }
            this.streamAwaiter.onData(msg);
        })
    });
    startLocalVideo = (stream) => {
        console.log('start local video',{stream});
        const video = this.videoWebCamRefLoc.current;
        if(video && !video.srcObject){
            video.srcObject = stream;
        }
    }
    getVideoStream = () => {
        console.log("gvs",{state:this.state});
        if(this.state.localStream){
            console.log("here get stream from state");
            return Promise.resolve({ stream: this.state.localStream, ref: this.videoWebCamRefLoc});
        }else{
            console.log("here get stream into state");
             return navigator.mediaDevices.getUserMedia({ video: true })
             .then(s=>{
                console.log("got stream:",{s})
                this.setState({localStream:s});
                return {
                    stream: s, ref: this.videoWebCamRefLoc
                };
             });
        }
    }
    startRTC = () => {
        const that = this;
        const vcManager = new RTCClientManager(that.state.userName, ()=>that.state.currentChannel, this.streamAwaiter,this.getVideoStream,
            (msg, checker) => that.sendToServer(that.state.socket, msg, checker),
            (e,partner) => {
                console.log("on track callback", { e, partner, partners: this.state.partners});
                this.getVideoStream()
                    .then(s => this.startLocalVideo(s.stream))
                
                this.setState({
                    partners:{
                        ...this.state.partners,
                        [partner]:{
                            videoWebCamRef:React.createRef(),
                            stream: e.streams[0]
                        }
                    }
                });
            }
        )
        that.setState({ vcManager });
    }
    startVideoChat = async ()=>{
        console.log("start video chat");
        const partners = remove(this.state.currentChannelUsers, this.state.userName);
        console.log({ partners,username:this.state.userName});
        await this.state.vcManager.broadCastOffer(partners);
        document.title = "[P]" + document.title 
        this.startLocalVideo((await this.getVideoStream()).stream);
    }
    render = ()=>(
        <section className="top" >
            current channel:{this.state.currentChannel}
            username:{this.state.userName}
            <button onClick={() => this.startVideoChat()}>vc</button>
            <div className="flex-row">
                {console.log(this.state)}
                <div className="channelBox">
                    <div>
                        channels
                    </div>
                    <div>
                        {Object.entries(this.state.channelsObj).map(([name,c]) => (
                            <div onClick={() => this.createChannelPostMessage(name)}
                            >
                                <label>
                                    {name}
                                </label>
                                <ul>
                                    {
                                        c.users.map(u=><li>{u.slice(0,10)}</li>)
                                    }
                                </ul>
                                
                            </div>
                        ))}
                    </div>
                </div>

                <div className="messageBox flex-column">
                    <ul>
                        {this.state.msgs.map(m => <li>{m}</li>)}
                    </ul>
                    <div className="messageBox-input flex-row">
                        <input placeholder="Enter Message" value={this.state.msg} onChange={(e) => this.setState({ msg: e.target.value })} />
                        <button onClick={() => this.createTextmessage()}></button>
                    </div>
                </div>
            </div>
            <div className="videos flex-row">
                <div>
                    <label className="flex-column">
                        local
                    </label>
                    <video autoPlay ref={this.videoWebCamRefLoc} id="videoElementLoc"></video>

                </div>
                {Object.entries(this.state.partners).map(([name,obj])=>(
                    <div className="flex-column">
                        <label>
                            {name}
                        </label>
                        <video autoPlay ref={obj.videoWebCamRef} id="videoElementFor" controls></video>
                    </div>
                ))}


            </div>
        </section>
    )

    login = (socket) => this.sendToServer<UserPostRequest, UserPostResponse>(
        socket,
        new UserPostRequest({ userName: this.state.userName }),
        m => isLoginResponse(m)
    ).then(msg => this.setState({
        debug:console.log("SET LOGGED IN STATE"),
        auth: true,
        channels: msg.payload.channels.map(c => c.name),
        channelsObj: ((c)=>{const obj = {};c.forEach(c=>obj[c.name]=c);return obj})(msg.payload.channels),
        currentChannelUsers: msg.payload.channels[0].users,
        currentChannel: msg.payload.channels[0].name
    })).then(() => console.log("login recieved")).catch(e => console.log("didnt recive login in time", { e }))
    createChannelPostMessage = (c) => {
        const req = new ChannelPostRequest({
            channelName: c,
            switchTo: true
        })
        this.sendToServer<ChannelPostRequest, ChannelPostResponse>(
            this.state.socket, req, (res) => isResponseTo(req, res, isChannelPostResponse)
        )
            .then(r => this.setState({
                msgs: [],
                msg: "",
                currentChannel: r.payload.channelName
            }))
            .catch(e => {
                console.log("channel change not responsed to ", { e });
            })
    }
    createTextmessage = () => {
        const req = new TextMessagePostRequest(this.state.msg,this.state.currentChannel);
        this.sendToServer<TextMessagePostRequest, TextMessagePostResponse>(
            this.state.socket, req, (res) => isResponseTo(req, res, isTextResponse)
        )
            .then(r => this.setState({
                msgs: [...this.state.msgs, `${newLineArt(r.payload.from.name, this.state.currentChannel)} ${r.payload.body}`],
                msg: ""
            }));
    }
}
const remove = (arr, el) => {
    const i = arr.indexOf(el);
    return [...arr.slice(0, i), ...arr.slice(i + 1, arr.length)]
}
document.addEventListener("DOMContentLoaded",()=>{
    ReactDOM.render(
        <SocketComponent/>,
        document.getElementById("root")
    );
})
