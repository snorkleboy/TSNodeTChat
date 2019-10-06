import * as React from "react";
import * as ReactDOM from "react-dom";
import * as io from 'socket.io-client';
import { Socket } from "socket.io";
import { TextMessagePostRequest } from "../../lib/messages/messages";
import { DestinationTypes } from "../../lib/messages/message";

interface HelloProps { compiler: string; framework: string; }
const Hello = (props: HelloProps) => <h1>Hello from {props.compiler} and {props.framework}!</h1>;

interface SocketProps {
    socket:Socket,
}
interface TypeingProps {
    msg:string
}
interface ReceivedMsgs{
    msgs:Array<string>
}
class SocketComponent extends React.Component {
    state: SocketProps & TypeingProps & ReceivedMsgs = {
        socket:null,
        msg:"",
        msgs:[]
    }
    constructor(props){
        super(props);
    }
    componentDidMount(){
        const socket = io('http://localhost/3005');
        this.state.socket.on("msg",(d)=>{
            this.state.msgs.push(d)
        })
        this.setState({socket});
    }
    render = ()=>(
        <div>
            <input onChange={(e) => this.setState({ msg:e.target.value})}/>
            <button onClick={()=>{
                this.state.socket.send(new TextMessagePostRequest({
                    body:this.state.msg,
                    destination:{
                        type:DestinationTypes.channel,
                        val:"any"
                    }
                }))
                this.setState({
                    msgs: [...this.state.msgs, this.state.msg] 
                })
            }}>submit</button>
        </div>
    )
}
document.addEventListener("DOMContentLoaded",()=>{
    ReactDOM.render(
        <Hello compiler="TypeScript" framework="React" />,
        document.getElementById("root")
    );
})
