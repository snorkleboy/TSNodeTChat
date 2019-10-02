import { match,when,def } from "../util/switchExp";
import { ClientType } from "../util/clientType";
import { Message,DestinationTypes, PostTextMessageRequest } from "../messages/message";
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
    channel: string,
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
const makeCommandWhens = (publicCommands: PublicCommands) => Object.entries(publicCommands)
    .map(([name, command]) => (
        when(({ input }) => input === name, () => command.action())
    ))
class Client{
    constructor(public socket) {
        this.publicCommands["/h"].action = () => console.log(
            Object.entries(this.publicCommands).map(([command, entry]) => `${command}-${entry}`)
        )
        this.socket.on("data",chunk=>this.receiveData(chunk))
    };
    private publicCommands: PublicCommands = {
        "/h": { name: 'help',action:null },
        "/c": { name: 'channels',action:null },
        "/q": { name: "quit",action:()=>this.setState({quit:true})}
    }
    private stdIn = process.openStdin();
    private state: clientData & {close:boolean}= {
        channel: null,
        name: null,
        clientType:ClientType.tcpClient,
        close:false
    };  
    setState = (inState)=>{
        this.state = {...this.state,...inState}
    }
    receiveData = (chunk)=>console.log(`${chunk.toString("utf8")}\n`)
    start = async () => {
        while (!this.state.close) {
            await this.promptReducer();
        }
        rl.close();
        this.socket.destroy();
    };
    promptReducer = () => match(this.state,
        when(s => !s.name, () => prompt("please Enter Name:\n:").then(name=>this.setState({name}) )),
        when(s => !s.channel, () => prompt("please Enter Desired Channel:\n:").then(channel=>this.setState({channel}) )),
        def(()=>prompt(`${this.state.name} | ${this.state.channel} ||=>:`).then(i=>this.inputReducer(i)))
    )
    inputReducer = (input:string)=>match({input,state:this.state},
        ...makeCommandWhens(this.publicCommands),
        def(({ input }) => this.writeToServer(this.createTextMessage(input)))
    );
    writeToServer = (msg: Message) => {
        const txt = JSON.stringify(msg);
        console.log({ txt, msg});
        this.socket.write(txt);
        return false;
    }
    createTextMessage = (msg: string): Message => new PostTextMessageRequest({
        body:msg,
        from:this.state.name,
        destination:{
            type:DestinationTypes.channel,
            val:0
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
