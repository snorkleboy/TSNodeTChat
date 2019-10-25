import { PureComponent } from "react";
import { WebRTCOfferStream, WebRTCAnswerStream, WebRTCIceCandidate } from "../../lib/messages/messages";
import {StreamAwaiter} from "../tcpClient/streamAwaiter"
const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
    }]
};


export class RTCClient{
    forCandidates = [];
    PC = null;
    isInitiator = false;
    sentOffer = false;
    offering=false;
    recievedOffer = false;
    public partner = null;
    constructor(
        public username:string,
        public channel: String,
        public streamAwaiter: StreamAwaiter,
        public getVideoStream,
        public sendMessageToTargetClient,
        public onTrackReceived,
        public onExtraPartner = null,
        public onPartner = null
    ){
        this.PC = new RTCPeerConnection(configuration);
        this.PC.onicecandidate = this.onicecandidate(sendMessageToTargetClient, username, channel).bind(this);
        this.PC.onnegotiationneeded = this.onnegotiationneeded(sendMessageToTargetClient, this.PC, channel, username);

        this.PC.ontrack = (e) => {
            console.log("PC.ontrack", { this: this, cs: this.PC.iceGatheringState, e })
            if (this.forCandidates.length > 0 && this.PC.iceGatheringState !== "completed") {
                this.forCandidates.forEach(c => {
                    console.log("receiveOffer - adding candidates", { c });
                    this.PC.addIceCandidate(c)
                });
            }
            onTrackReceived(e,this.partner);
        }
        this.waitForIce(streamAwaiter, this.PC, this.forCandidates, username);
        // this.waitForRTCOffer(streamAwaiter, this.PC, this.forCandidates, username, this.startOffering, sendMessageToTargetClient);
    }
    protected startOffering = async () => {
        console.log("start offering", !this.isInitiator && !this.offering,this)
        if (!this.isInitiator && !this.offering) {
            const stream = await this.getVideoStream();
            this.offering = true;
            stream.getTracks().forEach((track) => this.PC.addTrack(track, stream))
            return stream;
        }
    }
    
    startStream = async (onPartner = null) => {
        const stream = await this.startOffering()
        if (onPartner){
            this.onPartner = onPartner;
        }
        this.isInitiator = true;
        return stream;
    }
    waitForIce = (streamAwaiter: StreamAwaiter, PC, forCandidates: Array<any>, username: string) => {
        console.log("wait for ice",this);
        streamAwaiter.waitFor<WebRTCIceCandidate>(m => {
            if (
                (m as WebRTCIceCandidate).payload.candidate && 
                (m as WebRTCIceCandidate).payload.to === this.username &&
                (m as WebRTCIceCandidate).payload.from === this.partner
            ) {
                console.log("candidate", { m, this: this, partner: this.partner }, (m as WebRTCIceCandidate).payload.candidate && (m as WebRTCIceCandidate).payload.from === this.partner);
                return true;
            }
        }).then(ice => {
            console.log("got ice", { ice}, this);
            const candidate = ice.payload.candidate;
            if (candidate) {
                if (PC.remoteDescription) {
                    console.log("adding candidate", { candidate },this);
                        // this.forCandidates.push(candidate);
                        PC.addIceCandidate(candidate);
                } else {
                    forCandidates.push(candidate);
                }
            }
            this.waitForIce(streamAwaiter, PC, forCandidates, username);
        }).catch(e => console.log("receive offer went wront", { e }));
    }

    onOffer = async (msg:WebRTCOfferStream) => {
        if (this.recievedOffer && ( this.partner && !(msg.payload.renegotation && msg.payload.renegotation.to === this.username))){
            console.log("swallow reciegd offer",{msg,this:this})
            return;
        }
        this.recievedOffer = true;
        this.partner = msg.payload.from;
        const PC = this.PC;
        console.log("on recieve offer create answer",this, { cs: PC.signalingState, PC, msg });
        await PC.setRemoteDescription(msg.payload.description).catch(e=>console.error("ONOFFER couldnt set remote description",{msg}))
        if (this.forCandidates.length > 0) {
            console.log("receiveOffer - adding candidates");

            this.forCandidates.forEach(c => {
                PC.addIceCandidate(c)
            });
        }
        const ans = await PC.createAnswer()
        await PC.setLocalDescription(ans);
        const username = this.username;
        const res = new WebRTCAnswerStream(msg, { username }, PC.localDescription);
        console.log("sending answer", { res });
        this.sendMessageToTargetClient(res);
        this.startOffering();
    }
    onicecandidate = (sendMessageToTargetClient, username, channel) => ({ candidate }) => {
        if (candidate) {
            sendMessageToTargetClient(new WebRTCIceCandidate({
                channel,
                candidate,
                from: username,
                to:this.partner
            }));
        }

    }
    waitForAnswer = (PC,username) => this.streamAwaiter.waitFor((msg) => (msg as WebRTCAnswerStream).isResponse &&
            (msg as WebRTCAnswerStream).payload.description &&
            (msg as WebRTCAnswerStream).payload.offerFrom === username &&
            (!this.partner || (this.partner && (msg as WebRTCAnswerStream).payload.answerFrom === this.partner))
        ).then((answer: WebRTCAnswerStream) => {
            let ret;
            console.log("received answer", { answer, cs: PC.signalingState });
            if (this.partner && this.partner !== answer.payload.answerFrom) {
                console.log("extra partner going back to manager", this, answer);
                ret = setTimeout(() => {
                    this.onExtraPartner(answer);
                }, 1500)
            } else {
                this.partner = answer.payload.answerFrom;
                console.log("answer negotation partner setRemoteDesc", { this: this, answer });
                if (this.onPartner) {
                    this.onPartner(this.partner, answer);
                }

                ret = PC.setRemoteDescription(answer.payload.description).catch(e => console.error("ON ASWERtry set remote desc failed", { answer, e, this: this }))
            }
            this.waitForAnswer(PC,username);
            return ret;
        })
    onnegotiationneeded = (sendMessageToTargetClient, PC, channel, username) => async () => {
        console.log("onnegotiationneeded, try send offer", { partner: this.partner }, this);
        PC.createOffer()
            .then(offer => {
                console.log("set local description (negotation needed)", { cs: PC.connectionState, PC, ld: PC.localDescription, ldl: PC.currentLocalDescription });
                return PC.setLocalDescription(offer);
            })
            .then(() => {
                if(!this.sentOffer){
                    console.log("send offer", this, { PC, ld: PC.localDescription });
                    let offer = new WebRTCOfferStream({
                        channel,
                        from: username,
                        description: PC.localDescription
                    })
                    this.sentOffer = true;
                    sendMessageToTargetClient(offer)
                    return this.waitForAnswer(PC, username);
                }
            })
            .catch(e=>console.error("negotaiotn needed",{e}))
        }

}

export class RTCClientManager  {
    connections = {

    };
    initiator = null
    constructor(
        public username: string,
        public getChannel,
        public streamAwaiter: StreamAwaiter,
        public getVideoStream,
        public sendMessageToTargetClient,
        public onTrackReceived,
    ){
        this.waitForRTCOffer();
    }
    private waitForRTCOffer = () => {
        const that = this;
        this.streamAwaiter.waitFor<WebRTCOfferStream>(m => {
            if ((m as WebRTCOfferStream).payload.description && !(m as any).isResponse && (m as WebRTCOfferStream).payload.from !== this.username) {
                return true;
            }
        }).then(async msg => {
            const potentialPartner = msg.payload.from;
            this.gotPotentialPartner(potentialPartner, msg);

            that.waitForRTCOffer()
        }).catch(e => console.log("receive offer went wront", { e }));
    }
    private gotPotentialPartner = (potentialPartner,msg)=>{
        if (!this.connections[potentialPartner]) {
            console.log("manager got new offer", potentialPartner, { connections: this.connections, initiator: this.initiator, potentialPartner, msg, exists: !!this.connections[potentialPartner], this: this })
            const nClient = this.newConnection();
            // nClient.partner = potentialPartner;
            this.connections[potentialPartner] = nClient;
        }else{
            console.warn("manager got offer for existing conection", potentialPartner, { connections: this.connections, initiator: this.initiator,potentialPartner, msg, exists: !!this.connections[potentialPartner], this: this })
        }
        this.connections[potentialPartner].onOffer(msg);

    }
    private newConnection = ()=>{
        return new RTCClient(this.username, this.getChannel(), this.streamAwaiter, this.getVideoStream, this.sendMessageToTargetClient, this.onTrackReceived,(msg: WebRTCAnswerStream)=>{
            const potentialPartner = msg.payload.answerFrom;
            console.log("manager got extra answer", { connections: this.connections, initiator: this.initiator,potentialPartner, msg, exists: !!this.connections[potentialPartner], this: this })
            this.gotPotentialPartner(potentialPartner,msg);
        });
    }
    start = ()=>{
        this.initiator = this.newConnection();
        this.initiator.startStream((p,m)=>{
            this.connections[p] = this.initiator;
        });
    }
}