import * as React from "react";
require("./main.css");
import { Socket } from "socket.io";
import { newLineArt } from "../../lib/util/newline";
import { MessageLike } from "../../lib/messages/message";
import { ApiClient } from "../apiClient/apiClient";
import { ChannelBox, MessageBox, Socketer, VideosEl } from "./helpers";
import { HandledRequests, ChannelPostResponse, ChannelLeaveResponse } from "../../lib/messages/messages";
import { websocketMessageEventName } from "../../lib/store/sockets/socketName";

export type PartnersDict = { [k: string]: Partner }
export type ChannelObj = { [k: string]: { name: string, users: Array<string>, } }
interface VCState {
    localStream: any
    partners: PartnersDict
}
interface SocketState {
    socket: Socket,
    auth: false,
    currentChannel: string,
    channelsObj: ChannelObj,
    userName: string,
}
interface TypeingState {
    msg: string
}
interface ReceivedMsgs {
    msgs: Array<string>
}
interface Partner {
    videoWebCamRef,
    stream
}

export class App extends React.Component {
    state: SocketState & TypeingState & ReceivedMsgs & VCState = {
        socket: null,
        msg: "",
        msgs: [],
        channelsObj: {},
        currentChannel: null,
        auth: false,
        userName: "wsU " + Date.now() % 1000,
        localStream: null,
        partners: {},
    }
    apiClient: ApiClient
    videoWebCamRefLoc
    constructor(props) {
        super(props);
        this.videoWebCamRefLoc = React.createRef()
    }
    sendToServer = (socket, msg: MessageLike) => {
        const str = JSON.stringify(msg);
        socket.emit(websocketMessageEventName, str);
    }
    setSocketThenAuthenticate = (socket) => {
        document.title = this.state.userName;
        this.setState({ socket });
        console.log("configugre api client");
        this.configureAPIClient()
        this.apiClient.authenticate(this.state.userName)
            .then(msg => this.setState({
                auth: true,
                // channels: msg.payload.channels.map(c => c.name),
                channelsObj: ((c) => { const obj = {}; c.forEach(c => obj[c.name] = c); return obj })(msg.payload.channels),
                // currentChannelUsers: msg.payload.channels[0].users,
                currentChannel: msg.payload.channels[0].name
            }))
            .then(() => console.log("login recieved")).catch(e => console.log("didnt recive login in time", { e }))
    }

    componentDidUpdate(pp, ps) {
        if (ps.partners !== this.state.partners) {
            this.playForeignVideos();
        }
    }
    playForeignVideos = () => {
        Object.entries(this.state.partners).forEach(([name, obj]) => {
            if (!obj.videoWebCamRef.current.srcObject) {
                obj.videoWebCamRef.current.srcObject = obj.stream;
                obj.videoWebCamRef.current.play().then(p => console.log("playing", { p })).catch((error) => {
                    console.log({ name, error });
                });
            }
        })
    }
    configureAPIClient = () => this.apiClient = new ApiClient({
        hostIO: {
            write: (msg: HandledRequests) => this.sendToServer(this.state.socket, msg)
        },
        channels: {
            onChannelUsersChanged: (msg) => this.removeChannel(msg.payload.channelLeft, msg.payload.user.username,msg),
            onNewChannel: (msg) => this.addChannel(msg.payload.channelName, msg.payload.userThatJoined,msg),
        },
        messages: {
            onMessage: (msg) => {
                this.setState({
                    msgs: [...this.state.msgs, `${newLineArt(msg.payload.from.name, this.state.currentChannel)} ${msg.payload.body}`],
                })
            }
        },
        videos: {
            webRTC: {
                getStream: this.getVideoStream,
                onTrack: (e, partner) => {
                    console.log("on track callback", { e, partner, partners: this.state.partners });
                    this.getVideoStream()
                        .then(s => this.startLocalVideo(s.stream))

                    this.setState({
                        partners: {
                            ...this.state.partners,
                            [partner]: {
                                videoWebCamRef: React.createRef(),
                                stream: e.streams[0]
                            }
                        }
                    });
                }
            }
        }
    });
    getVideoStream = () => {
        if (this.state.localStream) {
            return Promise.resolve({ stream: this.state.localStream, ref: this.videoWebCamRefLoc });
        } else {
            return navigator.mediaDevices.getUserMedia({ video: true })
                .then(s => {
                    this.setState({ localStream: s });
                    return {
                        stream: s, ref: this.videoWebCamRefLoc
                    };
                });
        }
    }
    startLocalVideo = (stream) => {
        console.log('start local video', { stream });
        const video = this.videoWebCamRefLoc.current;
        if (video && !video.srcObject) {
            video.srcObject = stream;
        }
    }
    startVideoBroadcast = async () => {
        const users = this.state.channelsObj[this.state.currentChannel].users
        
        const partners = remove(users.slice(), this.state.userName);
        document.title = "[P]" + document.title
        await this.apiClient.offerVideo(partners);
        this.startLocalVideo((await this.getVideoStream()).stream);
    }
    addChannel = (channelName, userThatJoined,msg:ChannelPostResponse) => {
        let { channelsObj } = this.state
        channelsObj = { ...channelsObj};
        channelsObj[channelName] = {
            name: channelName,
            users: msg.payload.channelUsers
        }
        const displayName = userThatJoined === this.state.userName ? "You" : userThatJoined;
        console.log("add chanel", { msg,channelName, userThatJoined }, {
            msgs: [...this.state.msgs, `${displayName} joined ${channelName}`],
            channelsObj})

        this.setState({
            msgs: [...this.state.msgs, `${displayName} joined ${channelName}`],
            channelsObj
        })
    }
    removeChannel = (channelName, username,msg:ChannelLeaveResponse) => {
        console.log("remove channel",{ channelName, username, msg});
        let { channelsObj } = this.state
        const channels = {};
        if (channelsObj[channelName]){
            Object.keys(channelsObj).forEach(k=>{
                if(k !== channelName){
                    channels[k] = channelsObj[k]
                } else if (msg.payload.channelUsers.length>0){
                    channels[k] = {
                        channelName,
                        users:msg.payload.channelUsers
                    }
                }
            })
        }
        const displayName = username === this.state.userName ? "You" : username;
        this.setState({
            msgs: [...this.state.msgs, `${displayName} left ${channelName}`],
            channelsObj:channels
        })
    }
    
    createChannelPostMessage = (c) => this.apiClient.createChannel(c)
        .then(r => {
            this.setState({ msgs: [], msg: "", currentChannel: r.payload.channelName });
            this.addChannel(r.payload.channelName,this.state.userName,r);
        })
        .catch(e => console.log("channel change not responsed to ", { e }))

    createTextmessage = () => this.apiClient.sendTextMessage(this.state.msg, this.state.currentChannel)
        .then(r => this.setState({
            msgs: [...this.state.msgs, `${newLineArt(r.payload.from.name, this.state.currentChannel)} ${r.payload.body}`],
            msg: ""
        }));



    render = () => (
        <section className="top" >
            
            <Socketer
                setSocket={(socket) => this.setSocketThenAuthenticate(socket)}
                onMessage={(msg) => this.apiClient.receiveFromServer(msg)}
            />
            <div>
                current channel:{this.state.currentChannel}
                username:{this.state.userName}
            </div>
            <button onClick={() => this.startVideoBroadcast()}>vc</button>
            <div className="flex-row">
                <div className="left-panel">
                    <ChannelBox
                        channelsObj={this.state.channelsObj}
                        createChannelPostMessage={this.createChannelPostMessage}
                    />
                </div>
                <div className="right-panel">
                    <MessageBox
                        createTextmessage={this.createTextmessage}
                        msgs={this.state.msgs}
                        msg={this.state.msg}
                        setMsg={e => this.setState({ msg: e.target.value })}
                    />
                </div>


            </div>
            <VideosEl
                partners={this.state.partners}
                videoWebCamRef={this.videoWebCamRefLoc}
            />
        </section>
    )
}

const remove = (arr, el) => {
    const i = arr.indexOf(el);
    return [...arr.slice(0, i), ...arr.slice(i + 1, arr.length)]
}