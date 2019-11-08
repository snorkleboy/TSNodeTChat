import { UserPostResponse, HandledRequests, UserPostRequest, TextMessagePostRequest, TextMessagePostResponse, ChannelPostResponse, ChannelPostRequest ,HandledResponses, WebRTCAnswerOffer, WebRTCAnswerOfferResponse, WebRTCOfferStreamResponse} from "../../lib/messages/messages";
import { StreamAwaiter } from "./streamAwaiter";
import {match,when, def} from "../../lib/util/switchExp"
import { newLineArt} from "../../lib/util/newline"
import { DestinationTypes, MessageTypes, ActionTypes, MessageLike } from "../../lib/messages/message";
import { ApiClient } from "../apiClient/apiClient";
import { getNextMessage } from "../../lib/util/getNextMessage";
import { Socket } from "net";
var net = require('net');
const readline = require('readline');

let __debug = false;

type clientData = {
    channel: {name:string,id:number},
    name: string,
    videoPartner
}
type publicCommand = {
    name: string,
    action: Function
};
type PublicCommands = {
    [key: string]: publicCommand
}
const clear = ()=>{
    const lines = process.stdout.getWindowSize()[1];
    console.log('-------\n');

    // for (var i = 0; i < lines+2; i++) {
    //     console.log('\r\n');
    // }
    console.log('--------\n');

}

const logdebug = (...args)=>{
    if(__debug){
        console.log("__debug",...args)
    }
}

const commandsMaker: (clientContext: TCPClient)=>PublicCommands = (clientContext)=> ({
    "/h": { name: 'help', action: null },//made at construction
    "/c": {
        name: 'channels', action: () => clientContext.promptClient(clientContext.addClientMessage(`/c-channel-action-mode enter '{channelName}' to switch to\n`))
            .then(r => clientContext.client.createChannel(r))
            .then((m: ChannelPostResponse) => {clientContext
                .setState({ 
                    channel: { ...clientContext.state.channel,name: m.payload.channelName,debug:true }
                }) 
                console.log({ m, state: clientContext.state })
            })
               
    },
    "/q": { name: "quit", action: () => clientContext.setState({ quit: true }) }
})
const makeCommandWhens = (publicCommands: PublicCommands) => Object.entries(publicCommands)
    .map(([name, command]) => (
        when(({ input }) => input === name, () => command.action())
    ))
type ComponentState = clientData & { close: boolean, auth: boolean,msgs:Array<any> };

class TCPClient{
    client:ApiClient;
    protected clientStreamAwaiter: StreamAwaiter<string> =new StreamAwaiter();
    private publicCommands: PublicCommands = commandsMaker(this);
    private stdIn = process.openStdin();
    public state: ComponentState  = {
        channel: null,
        name: null,
        close: false,
        auth: false,
        videoPartner:null,
        msgs:[]
    };  
    constructor(
        public sendToClient:(msg)=>void,
        public sendToServer:(msg)=>void,
        public debug=false
        ) {
        __debug = debug;
        sendToClient = (msg,ender = this.lineStart())=>this.sendToClient(msg+"\n"+ender)
        this.publicCommands["/h"].action = () => console.log(
            Object.entries(this.publicCommands).map(([command, entry]) => `${command}-${entry}`)
        )
        this.client = new ApiClient({
            hostIO:{
                write: (m: MessageLike) => sendToServer(m)
            },
            channels:{
                onNewChannel:(m)=>{
                    return sendToClient(this.addClientMessage(`* user- ${m.payload.userThatJoined} joined channel- ${m.payload.channelName} *`));
                },
                onChannelUsersChanged:(m)=>{
                    return sendToClient(this.addClientMessage(`* user -${m.payload.user.username} left channel:${m.payload.channelLeft} *`));
                }
            },
            messages:{
                onMessage:(m)=>{
                    sendToClient(this.addClientMessage(`${this.lineStart(m.payload.from.name)}${m.payload.body}`));
                }
            },
            videos:{
                onDWSVideo:(m)=>{
                    return sendToClient(m.payload.video);
                },
                onVideoOfferedToThis:(msg)=>{
                    this.state.videoPartner = msg.payload.from;
                    return this.promptClient(
                        `got video offer from ${msg.payload.from}, "{width},{height}" to accept or anything else to decline:`
                    ).then(v=>{
                        const m = v.toString();
                        const [w, h] = m.split("\n")[0].split(",");
                        let areNums;
                        try {
                            areNums = parseInt(h) && parseInt(w)
                        } catch (e) {
                            areNums = false;
                        }
                        if (w !== 'n' && areNums) {
                            sendToServer(new WebRTCAnswerOffer(msg, { username: this.state.name }, { width: w, height: h }, true))
                        } else {
                            sendToClient("declined video offer");
                            this.state.videoPartner = null;
                        }
                    })
                }
            }
        });
    };
    receiveFromServer = (chunk) => {
        let json;
        try {
            json = JSON.parse(chunk.toString());
            logdebug("received From Server", { json });
            this.client.receiveFromServer(json);
        } catch (error) {
            if (this.debug) {
                console.warn("couldnt parse message");
            }
        }
    }
    receiveFromClient = (chunk) => {
        const str: string = chunk.toString();
        this.clientStreamAwaiter.onData(str);
    }
    start = async () => {
        while (!this.state.close) {
            logdebug("start await");
            console.log(this.state);
            await this.stateMachine();
            logdebug("finish await");
        }
    };
    protected getMessageList = () => this.state.msgs.join("\n");
    addClientMessage = (m:string)=>{
        const length = this.state.msgs.length;
        this.state.msgs = [...this.state.msgs.slice(length - 15, length), m];
        return this.getMessageList()+"\n";
    }
    protected lineStart = (othername: string = null) => `${newLineArt(othername || this.state.name, this.state.channel.name)}`
    setState = (inState)=>{
        this.state = {...this.state,...inState}
    }
    promptClient = (msg) => {
        this.sendToClient(msg);
        return this.clientStreamAwaiter.waitFor((m,n) => {
            n(false);
            return true;
        })
    }

    // [s => !s.channel, (s) => prompt("please Enter Desired Channel:\n:").then(channel=>{})],
    protected stateMachine = () => match(this.state,
        [s =>!s.auth,() => 
            this.promptClient("welcome to TChat, please Enter Name:\n")
                .then(name=>this.client.start(name))
                .then(m => this.setState({ name: m.payload.userName, channel: m.payload.channels[0], auth: true }))
        ],
        [s => s.auth,() => 
            this.promptClient(this.getMessageList() + "\n"+this.lineStart())
            .then(i=>{
                this.inputReducer(i)
            })
        ]
    )
    protected inputReducer = (input:string)=>match({input,state:this.state},
        ...makeCommandWhens(this.publicCommands),
        def(({ input }) => this.client.sendTextMessage(input,this.state.channel.name)
        .then((m)=>console.log("message sent",{m})))
    );

}
const createRLInterface = ()=>{
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

export const startClient = (port,address)=>{
const debug = false;

    const rl = createRLInterface();
    const hostConnection:Socket = new net.Socket();
    const tcpClient = new TCPClient(
        (msg) => {
            // console.log("SEND TO CLIENT",{msg});
            clear();
            process.stdout.write(msg)
        },
        (msg)=>{
            const txt = JSON.stringify(msg);
            logdebug("writing to server", { txt });
            hostConnection.write(txt);
        },
        debug
    );
    rl.on('line', (input) => {
        logdebug("on-line",{input});
        tcpClient.receiveFromClient(input);
    });
    hostConnection.on('close', function () {
        logdebug('Connection closed');
        rl.close();
    });

    hostConnection.connect(port, address, function () {
        logdebug('Connected');
        hostConnection.on("data", chunk => tcpClient.receiveFromServer(chunk));
        tcpClient.start()
            .then(m=>console.log("authenticated",{m},"\n"))
    });
}
