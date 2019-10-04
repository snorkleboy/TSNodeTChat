import { match,when,def } from "../util/switchExp";
import { ClientType } from "../util/clientType";
import { Message, ChannelPostRequest, UserPostRequest } from "../messages/message";
import { DestinationTypes,TextMessagePostRequest } from "../messages/message";
import { newLineArt } from "../util/newline";
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
    clientType:ClientType
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

type ComponentState = clientData & { close: boolean, auth: boolean };
class Client{
    private publicCommands: PublicCommands = commandsMaker(this);
    private stdIn = process.openStdin();
    public state: ComponentState  = {
        channel: { name: "all",id:0},
        name: null,
        clientType: ClientType.tcpClient,
        close: false,
        auth: false
    };  
    constructor(public socket) {
        this.publicCommands["/h"].action = () => console.log(
            Object.entries(this.publicCommands).map(([command, entry]) => `${command}-${entry}`)
        )
        this.socket.on("data",chunk=>this.receiveData(chunk))
    };

    setState = (inState)=>{
        this.state = {...this.state,...inState}
    }
    receiveData = (chunk)=>console.log(`${chunk.toString("utf8")}\n`)
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
                this.setState({ name, auth: true })
                this.writeToServer(this.makeLoginMessage());
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
    writeToServer = (msg: Message) => {
        const txt = JSON.stringify(msg);
        this.socket.write(txt);
    }
    makeLoginMessage = ()=> new UserPostRequest({
        userName:this.state.name
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
