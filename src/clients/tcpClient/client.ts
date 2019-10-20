import { UserPostResponse, HandledRequests, UserPostRequest, TextMessagePostRequest, TextMessagePostResponse, ChannelPostResponse, ChannelPostRequest ,HandledResponses} from "../../lib/messages/messages";
import { StreamAwaiter } from "./streamAwaiter";
import {match,when, def} from "../../lib/util/switchExp"
import { newLineArt} from "../../lib/util/newline"
import { DestinationTypes } from "../../lib/messages/message";
var net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = (question:string)=>new Promise<string>(r=>{
    rl.question(question,answer=>r(answer))
})
type clientData = {
    channel: {name:string,id:number},
    name: string,
}
type publicCommand = {
    name: string,
    action: Function
};
type PublicCommands = {
    [key: string]: publicCommand
}
const commandsMaker: (c: Client)=>PublicCommands = (ClientContext)=> ({
    "/h": { name: 'help', action: null },//made at construction
    "/c": {
        name: 'channels', action: () => new Promise((res, rej) => prompt(`/c 'channelName'`)
            .then(r => {
                ClientContext.setState({ channel: {name:r,id:ClientContext.state.channel.id} });
                ClientContext.writeToServer(ClientContext.makeCreateChannelCommand(r));
                res();
            })
        )
    },
    "/q": { name: "quit", action: () => ClientContext.setState({ quit: true }) }
})
const makeCommandWhens = (publicCommands: PublicCommands) => Object.entries(publicCommands)
    .map(([name, command]) => (
        when(({ input }) => input === name, () => command.action())
    ))


type ComponentState = clientData & { close: boolean, auth: boolean,msgs:Array<any> };

type setIdentity = ({useName:string})=>Promise<{id:number,channels:Array<any>}>


class Client{
    protected streamAwaiter =new StreamAwaiter();
    private publicCommands: PublicCommands = commandsMaker(this);
    private stdIn = process.openStdin();
    public state: ComponentState  = {
        channel: null,
        name: null,
        close: false,
        auth: false,
        msgs:[]
    };  
    constructor(public socket) {
        this.publicCommands["/h"].action = () => console.log(
            Object.entries(this.publicCommands).map(([command, entry]) => `${command}-${entry}`)
        )
        this.socket.on("data",chunk=>this.receiveData(chunk));
    };

    setState = (inState)=>{
        this.state = {...this.state,...inState}
    }
    receiveData = (chunk)=>{
        console.clear();
        let json;
        try {
            json = JSON.parse(chunk.toString());
        } catch (error) {
            console.error("couldnt parse message",{chunk});
        }

        console.log("received",{json});
        this.streamAwaiter.onData(json);
        if(json.payload && json.payload.body){
            this.state.msgs.push(`from ${json.payload.from.name}:${json.payload.body}`);
            this.state.msgs.forEach(m => console.log(m));
        }

    }
    start = async () => {
        while (!this.state.close) {
            await this.promptReducer();
            console.log("finish await");
        }
        rl.close();
        this.socket.destroy();
    };
        // [s => !s.channel, (s) => prompt("please Enter Desired Channel:\n:").then(channel=>{})],
    promptReducer = () => match(this.state,
        [s =>!s.auth,() => 
            prompt("please Enter Name:\n:")
            .then(name=>{
                let prom = this.streamAwaiter.waitFor<UserPostResponse>(m => {
                    if (m.isResponse && m.payload && m.payload.userName === name){
                        console.log("received login",{m})
                        return true;
                    }else{
                        console.log("received something else",{m});
                    }
                })
                    .then(m => this.setState({ name: m.payload.userName, channel: m.payload.channels[0], auth: true }))
                const req = this.makeLoginMessage(name);
                this.writeToServer(req);
                return prom;
            }).then(m => {
                console.log("login",{m});
            })
        ],
        [s => s.auth,() => 
            prompt(newLineArt(this.state.name,this.state.channel.name))
            .then(i=>this.inputReducer(i))
        ]
    )
    inputReducer = (input:string)=>match({input,state:this.state},
        ...makeCommandWhens(this.publicCommands),
        def(({ input }) => this.writeToServer(this.makeTextMessage(input)))
    );
    writeToServer = (msg: HandledRequests | UserPostRequest) => {
        const txt = JSON.stringify(msg);
        console.log("writing to server",{txt});
        this.socket.write(txt);
    }
    makeLoginMessage = (name)=> new UserPostRequest({
        userName: name
    })
    makeCreateChannelCommand = (name, switchTo = true) => new ChannelPostRequest({
        channelName:name,
        switchTo
    })
    makeTextMessage = (msg: string) => new TextMessagePostRequest({
        body:msg,
        destination:{
            type:DestinationTypes.channel,
            val:this.state.channel.name
        }
    })
}

export const startClient = (port,address)=>{
    var clientSocket = new net.Socket();
    clientSocket.connect(port, address, function () {
        console.log('Connected');
        const client = new Client(clientSocket).start();
    });
    
    
    clientSocket.on('close', function () {
        console.log('Connection closed');
    });

}
