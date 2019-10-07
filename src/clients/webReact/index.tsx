import * as React from "react";
import * as ReactDOM from "react-dom";

import io from 'socket.io-client';
import { Socket } from "socket.io";
import { TextMessagePostRequest, UserPostRequest, HandledResponses, TextMessagePostResponse, UserPostResponse, ChannelPostResponse, HandledRequests } from "../../lib/messages/messages";
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

interface SocketProps {
    socket:Socket,
    auth:false,
    channels:Array<any>,
    currentChannel:string
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
        auth:false
    }
    streamAwaiter = StreamAwaiter();
    constructor(props){
        super(props);
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
        this.login(this.configureSocket());
    }
    configureSocket = ()=>{
        const socket = io("localhost:3005", {
            transports: ['websocket']
        })
        this.setState({ socket });
        socket.on(websocketMessageEventName, (msg: HandledResponses | UserPostResponse) => {
            console.log("recieved", { msg });
            if (typeof msg === 'string') {
                try {
                    msg = JSON.parse(msg);
                } catch (error) {
                    console.log('json parse error', { msg, error });
                }
            }
            if (isChannelPostResponse(msg)) {
                msg = msg as ChannelPostResponse
                this.setState({
                    msgs: [...this.state.msgs, `${msg.payload.userThatJoined} joined ${msg.payload.channelName}`]
                })
            }
            this.streamAwaiter.onData(msg);

        })
        return socket;
    }
    login = (socket)=>this.sendToServer<UserPostRequest, UserPostResponse>(
            socket,
            new UserPostRequest({ userName: "websocket U" }),
            m => isLoginResponse(m)
        ).then(msg => this.setState({
            debug:console.log("recieved login",{msg}),
            auth: true,
            channels: msg.payload.channels,
            currentChannel: msg.payload.channels[0].name
        }))
    
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
            msgs: [...this.state.msgs, newLineArt(r.payload.from.name, this.state.currentChannel)],
            msg: ""
        }));
    }
    render = ()=>(
        <section className="flex-row">
            <div>channels
                <div>
                    {this.state.channels.map(c => <div>{c.name}</div>)}
                </div>
            </div>

            <div className="flex-column">
                <div >
                    {console.log({ state: this.state })}
                    <input onChange={(e) => this.setState({ msg: e.target.value })} />
                    <button onClick={()=>this.createTextmessage()}>submit</button>
                </div>
                <ul>
                    {this.state.msgs.map(m => <li>{m}</li>)}
                </ul>
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
