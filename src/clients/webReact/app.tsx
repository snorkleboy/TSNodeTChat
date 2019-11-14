import * as React from "react";
require("./main.css");
import { websocketMessageEventName } from "../../lib/store/sockets/socket";
import { Socket } from "socket.io";
import { newLineArt } from "../../lib/util/newline";
import { MessageLike } from "../../lib/messages/message";
import { ApiClient } from "../apiClient/apiClient";
import { ChannelBox, MessageBox, Socketer, VideosEl } from "./helpers";
import { HandledRequests } from "../../lib/messages/messages";

export type PartnersDict = { [k: string]: Partner }
export type ChannelObj = { [k: string]: { name: string, users: Array<string>, } }
interface VCState {
    localStream: any
    partners: PartnersDict
}
interface SocketState {
    socket: Socket,
    auth: false,
    channels: Array<string>,
    currentChannel: string,
    channelsObj: ChannelObj,
    currentChannelUsers: [],
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
        channels: [],
        channelsObj: {},
        currentChannelUsers: [],
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
    setSocket = (socket) => {
        document.title = this.state.userName;
        this.setState({ socket });
        this.configureAPIClient()
        this.apiClient.authenticate(this.state.userName)
            .then(msg => this.setState({
                auth: true,
                debug: console.log("auth", { msg }),
                channels: msg.payload.channels.map(c => c.name),
                channelsObj: ((c) => { const obj = {}; c.forEach(c => obj[c.name] = c); return obj })(msg.payload.channels),
                currentChannelUsers: msg.payload.channels[0].users,
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
    configureAPIClient = () => {
        this.apiClient = new ApiClient({
            hostIO: {
                write: (msg: HandledRequests) => this.sendToServer(this.state.socket, msg)
            },
            channels: {
                onChannelUsersChanged: (msg) => this.removeChannel(msg.payload.channelLeft, msg.payload.user.username),
                onNewChannel: (msg) => this.addChannel(msg.payload.channelName, msg.payload.userThatJoined),
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
    }

    startLocalVideo = (stream) => {
        console.log('start local video', { stream });
        const video = this.videoWebCamRefLoc.current;
        if (video && !video.srcObject) {
            video.srcObject = stream;
        }
    }
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
    startVideoBroadcast = async () => {
        const partners = remove(this.state.currentChannelUsers, this.state.userName);
        document.title = "[P]" + document.title
        await this.apiClient.offerVideo(partners);
        this.startLocalVideo((await this.getVideoStream()).stream);
    }
    addChannel = (channelName, userThatJoined) => {
        let { currentChannelUsers, channelsObj, channels } = this.state
        const channelObj = channelsObj[channelName];
        if (!channelsObj[channelName]) {
            channels = [...this.state.channels, channelName]
        } else if (userThatJoined !== this.state.userName) {
            currentChannelUsers = ([...channelObj.users, userThatJoined] as any)
            if (channelObj) {
                channelsObj[channelName] = { ...channelObj, users: currentChannelUsers }
            }
        }
        const displayName = userThatJoined === this.state.userName ? "You" : userThatJoined;
        this.setState({
            msgs: [...this.state.msgs, `${displayName} joined ${channelName}`],
            channels,
            currentChannelUsers,
            channelsObj
        })
    }
    removeChannel = (channelName, username) => {
        let { currentChannelUsers, channelsObj } = this.state
        if (channelsObj[channelName]) {
            currentChannelUsers = (remove(channelsObj[channelName].users, username) as any)
            channelsObj[channelName] = { ...channelsObj[channelName], users: currentChannelUsers }
        } else {
            console.log("unknown channel", { this: this, channelName, username });
        }
        const displayName = username === this.state.userName ? "You" : username;
        this.setState({
            msgs: [...this.state.msgs, `${displayName} left ${channelName}`],
            currentChannelUsers,
            channelsObj
        })
    }
    createChannelPostMessage = (c) => this.apiClient.createChannel(c)
        .then(r => this.setState({ msgs: [], msg: "", currentChannel: r.payload.channelName }))
        .catch(e => console.log("channel change not responsed to ", { e }))
    createTextmessage = () => this.apiClient.sendTextMessage(this.state.msg, this.state.currentChannel)
        .then(r => this.setState({
            msgs: [...this.state.msgs, `${newLineArt(r.payload.from.name, this.state.currentChannel)} ${r.payload.body}`],
            msg: ""
        }));



    render = () => (
        <section className="top" >
            <Socketer
                setSocket={(socket) => this.setSocket(socket)}
                onMessage={(msg) => {
                    console.log("from server", { msg });
                    this.apiClient.receiveFromServer(msg)
                }}
            />
            <div>
                current channel:{this.state.currentChannel}
                username:{this.state.userName}
            </div>
            <button onClick={() => this.startVideoBroadcast()}>vc</button>
            <div className="flex-row">
                {console.log(this.state)}
                <ChannelBox
                    channelsObj={this.state.channelsObj}
                    createChannelPostMessage={this.createChannelPostMessage}
                />
                <MessageBox
                    createTextmessage={this.createTextmessage}
                    msgs={this.state.msgs}
                    msg={this.state.msg}
                    setMsg={e => this.setState({ msg: e.target.value })}
                />
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