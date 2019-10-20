import { PureComponent } from "react";
import { WebRTCOfferStream, WebRTCAnswerStream, WebRTCIceCandidate } from "../../lib/messages/messages";
import {StreamAwaiter} from "../tcpClient/streamAwaiter"
const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
    }]
};

const waitForIce = (streamAwaiter: StreamAwaiter,PC, forCandidates: Array<any>, username: string ) => {
    console.log("wait for ice");
    streamAwaiter.waitFor<WebRTCIceCandidate>(m => {
        if ((m as WebRTCIceCandidate).payload.candidate && (m as WebRTCIceCandidate).payload.from !== username) {
            console.log("got ice", { m });
            return true;
        }
    }).then(ice => {
        const candidate = ice.payload.candidate;
        if (candidate) {
            if (PC.remoteDescription) {
                console.log("adding candidate", { candidate });
                if (PC.iceGatheringState !== "complete"){
                    PC.addIceCandidate(candidate);
                }
            }else{
                forCandidates.push(candidate);
            }
        }
        waitForIce(streamAwaiter,PC, forCandidates, username);
    }).catch(e => console.log("receive offer went wront", { e }));
}

const waitForRTCOffer = (streamAwaiter: StreamAwaiter,PC, forCandidates: Array<any>, username: string,startOffering, sendMessageToTargetClient: Function) => {
    streamAwaiter.waitFor<WebRTCOfferStream>(m => {
        if ((m as WebRTCOfferStream).payload.description && !(m as any).isResponse && (m as WebRTCOfferStream).payload.from !== username) {
            console.log("got offer");
            return true;
        }
    }).then(async msg => {
        console.log("on recieve offer create answer", { cs: PC.signalingState, PC, msg });
        await PC.setRemoteDescription(msg.payload.description);
        if (forCandidates.length > 0 && PC.iceGatheringState !== "completed") {
            forCandidates.forEach(c => {
                console.log("receiveOffer - adding candidates", { c });
                PC.addIceCandidate(c)
            });
        }
        const ans = await PC.createAnswer()
        console.log("receiveOffer - set local desc ", { cs: PC.signalingState, PC, msg, ld: PC.localDescription });
        await PC.setLocalDescription(ans);
        const res = new WebRTCAnswerStream(msg, { username }, PC.localDescription);
        console.log("sending answer", { res });
        sendMessageToTargetClient(res);
        startOffering();
        // waitForRTCOffer(streamAwaiter,PC, forCandidates, username, sendMessageToTargetClient);
    }).catch(e => console.log("receive offer went wront", { e }));
}
const onicecandidate = (sendMessageToTargetClient, username, channel)=>({ candidate }) => {
    if (candidate) {
        console.log("on ice candidate", { candidate });
        sendMessageToTargetClient(new WebRTCIceCandidate({
            channel,
            candidate,
            from: username
        }));
    }

}
const onnegotiationneeded = (sendMessageToTargetClient, PC,channel,username)=> async () => {
    console.log("onnegotiationneeded, try send offer");
    try {
        PC.createOffer()
            .then(offer => {
                console.log("set local description (negotation needed)", { cs: PC.connectionState, PC, ld: PC.localDescription, ldl: PC.currentLocalDescription });
                return PC.setLocalDescription(offer);
            })
            .then(() => {
                console.log("send offer", { PC, ld: PC.localDescription });
                return sendMessageToTargetClient(
                    new WebRTCOfferStream({
                        channel,
                        from: username,
                        description: PC.localDescription
                    }),
                    (msg) => (msg as WebRTCAnswerStream).isResponse && 
                        (msg as WebRTCAnswerStream).payload.description && 
                        (msg as WebRTCAnswerStream).payload.answerFrom !== username
                )
            })
            .then((answer) => {
                console.log("received answer", { answer, cs: PC.signalingState });
                PC.setRemoteDescription(answer.payload.description)
            })

    } catch (error) {
        console.error({ error });
    }

};
export const newRTCConnection = (username,getVideoStream,streamAwaiter) => {
    const forCandidates = [];
    return (sendMessageToTargetClient, channel, onTrackReceived) => {//sendMessageToTargetClient,onGetStream,onTrySendStream
        const PC = new RTCPeerConnection(configuration);
        let isInitiator = false;
        const startOffering = async ()=>{
            if(!isInitiator){
                const stream = await getVideoStream()
                stream.getTracks().forEach((track) => PC.addTrack(track, stream))
                return stream;
            }
            
        }
        PC.onicecandidate = onicecandidate(sendMessageToTargetClient, username, channel);
        PC.onnegotiationneeded = onnegotiationneeded(sendMessageToTargetClient, PC, channel, username);

        PC.ontrack = (e) => {
            console.log("on track", { cs: PC.signalingState, e })
            onTrackReceived(e);
        }

        waitForIce(streamAwaiter, PC, forCandidates, username);
        waitForRTCOffer(streamAwaiter, PC, forCandidates, username,startOffering,sendMessageToTargetClient);
        return {
            PC,
            startStream:async ()=>{
                const stream = await startOffering()
                isInitiator = true;
                return stream;
            }
        }
    }
}