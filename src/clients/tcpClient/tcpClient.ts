import { UserPostResponse, HandledRequests, UserPostRequest, TextMessagePostRequest, TextMessagePostResponse, ChannelPostResponse, ChannelPostRequest ,HandledResponses, WebRTCAnswerOffer, WebRTCAnswerOfferResponse, WebRTCOfferStreamResponse} from "../../lib/messages/messages";
import { StreamAwaiter } from "../apiClient/streamAwaiter";
import {match,when, def} from "../../lib/util/switchExp"
import { newLineArt} from "../../lib/util/newline"
import { DestinationTypes, MessageTypes, ActionTypes, MessageLike } from "../../lib/messages/message";
import { ApiClient } from "../apiClient/apiClient";
import { getNextMessage } from "../../lib/util/getNextMessage";


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

const logdebug = (...args)=>{
    if(__debug){
        console.log("__debug",...args)
    }
}

type ComponentState = clientData & { close: boolean, auth: boolean,msgs:Array<any> };
export class TCPClient{
    protected hostAPIclient:ApiClient;
    protected clientStreamAwaiter: StreamAwaiter<string> =new StreamAwaiter();

    protected state: ComponentState  = {
        channel: null,
        name: null,
        close: false,
        auth: false,
        videoPartner:null,
        msgs:[]
    };  
    constructor(
        io:{
            sendToClient:(msg:string)=>void,
            sendToServer:(msg:HandledRequests)=>void
        },
        public onAuth=null,
        public debug=false,
        public sendToClient = io.sendToClient,
        public sendToServer = io.sendToServer
    ) {
        __debug = debug;
        this.makeApiClient(sendToServer, (msg: string, ender = this.lineStart()) => this.sendToClient(msg + "\n" + ender));
        this.makeHelpCommand();
    };
    receiveFromServer = (json) => {
        logdebug("received From Server", { json });
        this.hostAPIclient.receiveFromServer(json);
    }
    receiveFromClient = (str: string) => {
        logdebug("received From client", { str });
        this.clientStreamAwaiter.onData(str);
    }
    start = async () => {
        while (!this.state.close) {
            logdebug("start await", this.state);
            await this.stateMachine();
            logdebug("finish await", this.state);
        }
    };
    authenticate = (inspectMessage = null, send = null) => this.promptClient("welcome to TChat, please Enter Name:\n")
        .then(name => {
            let shouldRun = true;
            if (inspectMessage) {
                shouldRun = inspectMessage(name, this.state.name);
            }
            if (shouldRun) {
                return this.hostAPIclient.authenticate(name, send)
                    .then(m => {
                        this.setState({ name: m.payload.userName, channel: m.payload.channels[0], auth: true });
                        this.sendToClient("\nauthenticated\n");
                        if (this.onAuth) {
                            this.onAuth(m)
                        }
                    })
            } else {
                this.setState({ close: true });
                return null;
            }
        })
    protected handleVideoConfigResponse = (v, sendToServer, sendToClient, offerMsg) => {
        const m = v.toString();
        const [w, h] = m.split("\n")[0].split(",");
        let areNums;
        try {
            areNums = parseInt(h) && parseInt(w)
        } catch (e) {
            areNums = false;
        }
        if (w !== 'n' && areNums) {
            sendToServer(new WebRTCAnswerOffer(
                    offerMsg,
                    { username: this.state.name },
                    { width: w, height: h },
                    true
                )
            )
        } else {
            sendToClient("declined video offer");
            this.state.videoPartner = null;
        }
    }
    protected makeApiClient = (sendToServer, sendToClient)=>{
        this.hostAPIclient = new ApiClient({
            hostIO: {
                write: (m: HandledRequests) => sendToServer(m)
            },
            channels: {
                onNewChannel: (m) => sendToClient(
                    this.addClientMessage(`* user- ${m.payload.userThatJoined} joined channel- ${m.payload.channelName} *`)
                )
                ,
                onChannelUsersChanged: (m) => sendToClient(
                    this.addClientMessage(`* user -${m.payload.user.username} left channel:${m.payload.channelLeft} *`)
                )
            },
            messages: {
                onMessage: (m) => sendToClient(
                    this.addClientMessage(`${this.lineStart(m.payload.from.name)}${m.payload.body}`)
                )

            },
            videos: {
                dwsVideo:{
                    onDWSVideo: (m) => sendToClient(`${m.payload.video} \n${this.getMessageList()}`),
                    onVideoOfferedToThis: (msg) => {
                        this.state.videoPartner = msg.payload.from;
                        return this.promptClient(
                            `got video offer from ${msg.payload.from}, "{width},{height}" to accept or anything else to decline:`, true
                        ).then(v => {
                            this.handleVideoConfigResponse(v, sendToServer, sendToClient, msg);
                        })
                    }
                }
            }
        });
    }

    protected getMessageList = () => this.state.msgs.join("\n");
    protected addClientMessage = (m:string)=>{
        const length = this.state.msgs.length;
        this.state.msgs = [...this.state.msgs.slice(length - 5, length), m];
        return this.getMessageList()+"\n";
    }
    protected lineStart = (othername: string = null) => `${newLineArt(othername || this.state.name, this.state.channel.name)}`
    private setState = (inState)=>{
        this.state = {...this.state,...inState}
    }
    protected promptClient = (msg:string,top=false) => {
        this.sendToClient(msg);
        return this.clientStreamAwaiter.waitFor((m,n) => {
            n(false);
            return true;
        }, null,top)
    }

    protected stateMachine = () => match(this.state,
        [s => !s.auth, () => this.authenticate()],
        [s => s.auth,() => this.listen()]
    )

        
    protected listen = () => this.promptClient(this.getMessageList() + "\n" + this.lineStart())
        .then(i => {
            this.inputReducer(i)
        })
    private makeHelpCommand =()=>{
        this.publicCommands["/h"].action = () => this.addClientMessage(
            Object.entries(this.publicCommands).map(([commmandKey, entry]) => `${commmandKey} - ${entry.name}`).join(",\n")
        )
    }
    protected publicCommands: PublicCommands = {
        "/h": {
            name: 'help',
            action: null
        },//made at construction
        "/c": {
            name: 'channels',
            action: () => this.promptClient(this.addClientMessage(`/c-channel-action-mode enter '{channelName}' to switch to\n`))
                .then(r => this.hostAPIclient.createChannel(r))
                .then((m: ChannelPostResponse) => this.setState({
                    channel: { name: m.payload.channelName }
                }))
        },
        // "/q": {
        //     name: "quit",
        //     action: () => this.setState({ quit: true })
        // }
    }
    protected inputReducer = (input:string)=>match({input,state:this.state},
        ...Object.entries(this.publicCommands)
            .map(([commandKey, command]) => (
                when(({ input }) => input === commandKey, () => command.action())
            )),
        def(({ input }) => this.hostAPIclient.sendTextMessage(input,this.state.channel.name) && console.log("default input handler",{input}))
    );

}
