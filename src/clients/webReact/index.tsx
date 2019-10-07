import * as React from "react";
import * as ReactDOM from "react-dom";

import io from 'socket.io-client';
import { Socket } from "socket.io";
import { TextMessagePostRequest, UserPostRequest, HandledResponses, TextMessagePostResponse, UserPostResponse } from "../../lib/messages/messages";
import { DestinationTypes } from "../../lib/messages/message";
import { StreamAwaiter } from "../tcpClient/streamAwaiter";
import { websocketMessageEventName } from "../../lib/store/sockets/socket";
interface HelloProps { compiler: string; framework: string; }
const Hello = (props: HelloProps) => (
    <section>
        <SocketComponent/>
    </section>
)

interface SocketProps {
    socket:Socket,
    auth:false,
    channels:Array<any>
}
interface TypeingProps {
    msg:string
}
interface ReceivedMsgs{
    msgs:Array<string>
}

const isLoginResponse = (msg:HandledResponses|UserPostResponse):msg is UserPostResponse=>!!((msg as UserPostResponse).payload.userName)
const isTextResponse = (msg: HandledResponses | UserPostResponse):msg is TextMessagePostResponse=>!!(msg as TextMessagePostResponse).payload.body
class SocketComponent extends React.Component {
    state: SocketProps & TypeingProps & ReceivedMsgs = {
        socket:null,
        msg:"",
        msgs:[],
        channels:[],
        auth:false
    }
    streamAwaiter = StreamAwaiter();
    constructor(props){
        super(props);
    }
    componentDidMount(){
        const socket = io("localhost:3005",{
            transports: ['websocket']
        })
        this.setState({ socket });
        socket.on(websocketMessageEventName, (msg: HandledResponses | UserPostResponse)=>{
            console.log("recieved",{msg});
            if (typeof msg === 'string'){
                try {
                    msg = JSON.parse(msg);
                } catch (error) {
                    console.log('json parse error',{msg,error});
                }
            }
            if (isTextResponse(msg)){
                const payload = msg.payload.body;
                this.setState({
                    msgs: [...this.state.msgs, payload]
                })
            }else if(isLoginResponse(msg)){
                this.setState({ auth: true, channels: msg.payload.channels});
            }
            this.streamAwaiter.onData(msg);

        })
        console.log("sending login");
        const login = new UserPostRequest({ userName: "tima" })
        this.sendToServer(JSON.stringify(login),socket)
    }
    sendToServer = (msg,socket)=>{
        console.log("sending to server",{msg});
        socket.emit(websocketMessageEventName,msg);
    }
    render = ()=>(
        <div>
            <div>
                {console.log({state:this.state})}
                <input onChange={(e) => this.setState({ msg: e.target.value })} />
                <button onClick={() => {
                    this.sendToServer(new TextMessagePostRequest({
                        body: this.state.msg,
                        destination: {
                            type: DestinationTypes.channel,
                            val: this.state.channels[0].name
                        }
                    }),this.state.socket)
                    this.setState({
                        msgs: [...this.state.msgs],
                        msg:""
                    })
                }}>submit</button>
            </div>
            <ul>
                {this.state.msgs.map(m=><li>{m}</li>)}
            </ul>

        </div>
    )
}
document.addEventListener("DOMContentLoaded",()=>{
    ReactDOM.render(
        <Hello compiler="TypeScript" framework="React" />,
        document.getElementById("root")
    );
})
