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
interface HelloProps { compiler: string; framework: string; }
const Hello = (props: HelloProps) => (
    <section>
        <SocketComponent/>
    </section>
)
console.log({ websocketMessageEventName})
interface SocketProps {
    socket:Socket,
    auth:false,
    channels:Array<string>,
    currentChannel:string,
    userName:string
}
interface TypeingProps {
    msg:string
}
interface ReceivedMsgs{
    msgs:Array<string>
}
type sendToServer = {
    <Req extends HandledRequests | UserPostRequest, Res extends HandledResponses | UserPostResponse>(
        socket: Socket,
        msg: Req,
        checker?: StreamChecker<Res>
    ): Promise<Res>;
    <Req extends HandledRequests | UserPostRequest, Res extends HandledResponses | UserPostResponse>(
        socket: Socket,
        msg: Req,
        checker?:null|undefined
    ): void
}
const isChannelPostResponse = (msg:HandledResponses|UserPostResponse)=>!!(msg as ChannelPostResponse).payload.userThatJoined
const isLoginResponse = (msg:HandledResponses|UserPostResponse):msg is UserPostResponse=>!!((msg as UserPostResponse).payload.userName);

const isResponseTo = (req: HandledRequests | UserPostRequest, res: HandledResponses | UserPostResponse, otherCheck: (r: HandledResponses | UserPostResponse)=>boolean) => !!(otherCheck(res) && res.type === req.type && res.action === req.action);
const isTextResponse = (msg: HandledResponses | UserPostResponse):msg is TextMessagePostResponse=>!!(msg as TextMessagePostResponse).payload.body
class SocketComponent extends React.Component {
    state: SocketProps & TypeingProps & ReceivedMsgs = {
        socket:null,
        msg:"",
        msgs:[],
        channels:[],
        currentChannel:null,
        auth:false,
        userName: "websocket U " + Date.now()%1000 
    }
    videoWebCamRef
    streamAwaiter = StreamAwaiter();
    constructor(props){
        super(props);
        this.videoWebCamRef = React.createRef();
    }
    sendToServer: sendToServer = (socket, msg, checker = null) => {
        console.log("sending to server", { msg });
        const str = JSON.stringify(msg);
        socket.emit(websocketMessageEventName, str);
        if (checker) {
            return this.streamAwaiter.waitFor(checker);
        } else {
            return null
        }
    }
    componentDidMount(){
        this.configureSocket();
        if (navigator.mediaDevices.getUserMedia) {
            const video = this.videoWebCamRef.current;
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    video.srcObject = stream;
                    console.log({stream});
                })
                .catch(function (err0r) {
                    console.log("Something went wrong!");
                });
        }
    }
    configureSocket = ()=>{
        const socket = io("localhost:3005", {
            transports: ['websocket']
        })
        this.setState({ socket });
        socket.on("error",(e)=>{console.log("error",{e})});
        socket.on("connect_error", (e) => { console.log("connect_error", { e }) });
        socket.on("connect_timeout", (e) => { console.log("connect_timeout", { e }) });
            
        socket.on("reconnect_attempt", (e) => { 
            console.log("reconnect_attempt", new Date().getMinutes(), { e }); this.setState({ auth: false })
        });
        socket.on("reconnect", (e) => console.log("reconnect"));
        socket.on("reconnecting", (e) => { console.log("reconnecting", new Date().getMinutes(), { e }) });
        socket.on("reconnect_error", (e) => { console.log("reconnect_error",new Date().getMinutes(), { e }) });
        socket.on("reconnect_failed", (e) => { console.log("reconnect_failed", new Date().getMinutes(), { e }) });


        socket.on("dissconnect", (e) => { console.log("dissconnect", { e }) });
        socket.on("connect", (e) => {
            this.login(this.state.socket);
            console.log("connect", new Date().getMinutes(), { e }) 
        });

        socket.on(websocketMessageEventName, (msg: HandledResponses | UserPostResponse) => {
            console.log("recieved", { msg });
            if (typeof msg === 'string') {
                try {
                    msg = JSON.parse(msg);
                } catch (error) {
                    console.log('json parse error', { msg, error });
                }
            }
            if(this.state.auth){
                if (isTextResponse(msg) && msg.payload.from.name !== this.state.userName) {
                    this.setState({
                        msgs: [...this.state.msgs, `${newLineArt(msg.payload.from.name, this.state.currentChannel)} ${msg.payload.body}`],
                    })
                }
                if (isChannelPostResponse(msg) && (msg as ChannelPostResponse).payload.channelName !== this.state.currentChannel) {
                    msg = msg as ChannelPostResponse
                    this.setState({
                        msgs: [...this.state.msgs, `${msg.payload.userThatJoined} joined ${msg.payload.channelName}`],
                        channels: [...this.state.channels, msg.payload.channelName]
                    })

                }
            }
            this.streamAwaiter.onData(msg);


        })
        return socket;
    }
    login = (socket)=>this.sendToServer<UserPostRequest, UserPostResponse>(
            socket,
            new UserPostRequest({ userName: this.state.userName}),
            m => isLoginResponse(m)
        ).then(msg => this.setState({
            auth: true,
            channels: msg.payload.channels.map(c=>c.name),
            currentChannel: msg.payload.channels[0].name
        })).then(()=>console.log("login recieved")).catch(e=>console.log("didnt recive login in time",{e}))
    createChannelPostMessage = (c)=>{
        const req = new ChannelPostRequest({
            channelName:c,
            switchTo:true
        })
        this.sendToServer<ChannelPostRequest, ChannelPostResponse>(
            this.state.socket, req, (res) => isResponseTo(req, res, isChannelPostResponse)
        )
            .then(r => this.setState({
                msgs: [],
                msg: "",
                currentChannel:r.payload.channelName
            }))
            .catch(e=>{
                console.log("channel change not responsed to ",{e});
            })
    }
    createTextmessage = () => {
        const req = new TextMessagePostRequest({
            body: this.state.msg,
            destination: {
                type: DestinationTypes.channel,
                val: this.state.currentChannel
            }
        });
        this.sendToServer<TextMessagePostRequest, TextMessagePostResponse>(
            this.state.socket, req, (res) => isResponseTo(req, res, isTextResponse)
        )
        .then(r => this.setState({
            msgs: [...this.state.msgs, `${newLineArt(r.payload.from.name, this.state.currentChannel)} ${r.payload.body}`],
            msg: ""
        }));
    }
    render = ()=>(
        <section className="top" >
            current channel:{this.state.currentChannel}
            <div className="flex-row">
                {console.log(this.state)}
                <div className="channelBox">
                    <div>
                        channels
                    </div>
                    <div>
                        {this.state.channels.map(c => (
                            <div onClick={() => this.createChannelPostMessage(c)}
                            >{c}</div>
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
            <div>
                <video autoPlay ref={this.videoWebCamRef} id="videoElement"></video>
            </div>
        </section>


    )
}

document.addEventListener("DOMContentLoaded",()=>{
    ReactDOM.render(
        <Hello compiler="TypeScript" framework="React" />,
        document.getElementById("root")
    );
})
