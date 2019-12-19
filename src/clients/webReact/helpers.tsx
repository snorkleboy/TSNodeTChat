import * as React from "react";
import { PartnersDict, ChannelObj} from "./app";
import { useState, useEffect } from "react";
import { websocketMessageEventName } from "../../lib/store/sockets/socketName";
import io from 'socket.io-client';

import { HandledResponses, UserPostRequest, UserPostResponse } from "../../lib/messages/messages";
interface VidProps {
    partners: PartnersDict,

    videoWebCamRef
}
interface ChanProps {
    channelsObj: ChannelObj,
    createChannelPostMessage
}
//
interface MessProps {
    msgs: Array<string>,
    msg: string,
    setMsg: (e: React.ChangeEvent<HTMLInputElement>) => any,
    createTextmessage: () => any
}
export const MessageBox = ({ msgs, msg, setMsg, createTextmessage }: MessProps) => (
    <div className="messageBox flex-column">
        <ul>
            {msgs.map(m => <li key={m}>{m}</li>)}
        </ul>
        <div className="messageBox-input flex-row">
            <input placeholder="Enter Message" value={msg} onChange={setMsg} />
            <button onClick={() => createTextmessage()}></button>
        </div>
    </div>
)
export const ChannelBox = ({ channelsObj, createChannelPostMessage }: ChanProps) => (
    <div className="channelBox">
        <div>
            channels
        </div>
        <div>
            <ChannelAdder postChannel={createChannelPostMessage}/>
            {Object.entries(channelsObj).map(([name, c]) => (
                <div key={name} onClick={() => createChannelPostMessage(name)}
                >
                    <label>
                        {name}
                    </label>
                    <ul>
                        {
                            c.users.map(u => <li key={u}>{u.slice(0, 10)}</li>)
                        }
                    </ul>

                </div>
            ))}
        </div>
    </div>
)
const ChannelAdder = ({postChannel})=>{
    const [adding,setAdding] = useState(false);
    const [name,setName] = useState("");
    return (
        <div>
            {adding ?
                <div>
                    <input value={name} onChange={(e)=>setName(e.target.value)}/>
                    <button onClick={()=>{
                        setName("");
                        setAdding(false);
                        postChannel(name);
                    }}>+</button>
                </div>
                :
                <div onClick={() => setAdding(true)}>
                    +
                </div>
            }
        </div>
    )
}
export const VideosEl = ({ partners, videoWebCamRef }: VidProps) => (
    <div className="videos flex-row">
        <div>
            <label className="flex-column">
                local
                    </label>
            <video autoPlay ref={videoWebCamRef} id="videoElementLoc"></video>

        </div>
        {Object.entries(partners).map(([name, obj]) => (
            <div key={name} className="flex-column">
                <label>
                    {name}
                </label>
                <video autoPlay ref={obj.videoWebCamRef} id="videoElementFor" controls></video>
            </div>
        ))}


    </div>
)
export const Socketer = ({ setSocket, onMessage }) => {
    useEffect(() => {
        let addr = "localhost";
        addr = "localhost"
        addr = addr + ":3005";
        const socket = io(addr, {
            transports: ['websocket']
        });

        ["error", "connect_error", "connect_timeout", "reconnect", "reconnecting", "reconnect_error", "reconnect_failed", "dissconnect"]
            .forEach(ev => {
                socket.on(ev, (e) => console.log(ev, { e }))
            });

        socket.on("reconnect_attempt", (e) => {
            console.log("reconnect_attempt", new Date().getMinutes(), { e });
            this.setState({ auth: false })
        });
        socket.on("connect", (e) => {
            console.log("socket connect");
            setSocket(socket);
        });
        socket.on(websocketMessageEventName, (msg: HandledResponses | UserPostResponse) => {
            if (typeof msg === 'string') {
                try {
                    msg = JSON.parse(msg);
                } catch (error) {
                    console.log('json parse error', { msg, error });
                }
            }
            onMessage(msg);
        });
    }, [])
    return (
        <></>
    )
}