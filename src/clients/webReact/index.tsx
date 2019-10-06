import * as React from "react";
import * as ReactDOM from "react-dom";
import io from 'socket.io-client';
import { Socket } from "socket.io";
import { TextMessagePostRequest } from "../../lib/messages/messages";
import { DestinationTypes } from "../../lib/messages/message";

interface HelloProps { compiler: string; framework: string; }
const Hello = (props: HelloProps) => (
    <section>
        <SocketComponent/>
    </section>
)

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
        const socket = io("localhost:3005")
        socket.on("msg",(d)=>{
            this.setState({
                msgs:[...this.state.msgs,d]
            })
        })
        this.setState({socket});
    }
    render = ()=>(
        <div>
            <div>
                <input onChange={(e) => this.setState({ msg: e.target.value })} />
                <button onClick={() => {
                    this.state.socket.send(new TextMessagePostRequest({
                        body: this.state.msg,
                        destination: {
                            type: DestinationTypes.channel,
                            val: "any"
                        }
                    }))
                    this.setState({
                        msgs: [...this.state.msgs, this.state.msg]
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
