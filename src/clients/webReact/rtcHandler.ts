import { PureComponent } from "react";
import { WebRTCOfferStream, WebRTCAnswerOffer, WebRTCIceCandidate, WebRTCAnswerOfferResponse, WebRTCOfferStreamResponse } from "../../lib/messages/messages";
import {StreamAwaiter} from "../tcpClient/streamAwaiter"
import { DestinationTypes, ActionTypes, MessageLike, Response, SingleUserDestination } from "../../lib/messages/message";
const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
    }]
};

class PartnerConnection{
    localDescription
    foreignDescription
    PC

    partnerIceCandidates=[]
    constructor(
        public username: string,
        public channel: string,
        public partner: string,
        public streamAwaiter: StreamAwaiter,
        public getVideoStream,
        public sendMessageToTargetClient,
        public onTrackReceived,
    ){
        this.PC = new RTCPeerConnection(configuration);
        this.PC.onicecandidate = this.sendIceCandidate;
        this.PC.onnegotiationneeded = this.sendOffer;
        this.PC.ontrack = this.onTrack;
        this.waitForIce();
    }
    startOffering = async () => {
        console.log("start offering", this)
        const stream = await this.getVideoStream();
        stream.getTracks().forEach((track) => this.PC.addTrack(track, stream));
        return stream;
    }
    onOffer = async (msg: WebRTCOfferStreamResponse) => {
        const PC = this.PC;
        console.log("on recieve offer create answer", this, { cs: PC.signalingState, PC, msg });
        this.foreignDescription = msg.payload.description;
        await PC.setRemoteDescription(this.foreignDescription)
            .catch(e => console.error("ONOFFER couldnt set remote description", { e, this: this, msg }))
        this.addCandidatesToPC();
        const ans = await PC.createAnswer();
        this.localDescription = ans
        await PC.setLocalDescription(this.localDescription);
        const res = new WebRTCAnswerOffer(msg, { username:this.username }, PC.localDescription);
        console.log("sending answer", { res });
        this.sendMessageToTargetClient(res);
        this.startOffering();
    }
    protected onTrack = (e) => {
        console.log("PC.ontrack", { this: this, cs: this.PC.iceGatheringState, e })
        this.addCandidatesToPC();
        this.onTrackReceived(e, this.partner);
    }
    protected sendOffer = async () => this.PC.createOffer()
        .then(offer => {
            this.localDescription = offer;
            const PC = this.PC;
            console.log("onnegotiationneeded set local description", { cs: PC.connectionState, PC, ld: PC.localDescription, ldl: PC.currentLocalDescription });
            return this.PC.setLocalDescription(this.localDescription);
        })
        .then(() => {
            const offer = new WebRTCOfferStream({
                from: this.username,
                description: this.PC.localDescription
            }, {
                type: DestinationTypes.singleUser,
                val: { channel:this.channel, user: this.partner }
            } )
            const PC = this.PC;
            console.log("onnegotiationneeded send offer", this, { offer, PC, ld: PC.localDescription });
            this.sendMessageToTargetClient(offer)
        })
        .then(() => this.streamAwaiter.waitFor((msg: WebRTCAnswerOfferResponse) => (
            msg.payload.description &&
            msg.payload.originalOfferFrom === this.username &&
            msg.payload.answerFrom === this.partner
        )))
        .then((answer: WebRTCAnswerOfferResponse) => {
            console.log("onnegotiationneeded received answer", { answer, cs: this.PC.signalingState });
            this.foreignDescription = answer.payload.description;
            return this.PC.setRemoteDescription(this.foreignDescription)
                .catch(e => console.error("ON ASWERtry set remote desc failed", { answer, e, this: this }))
        });

    
    protected addCandidatesToPC = ()=>{
        if (this.partnerIceCandidates.length > 0) {// && this.PC.iceGatheringState !== "completed"
            console.log("adding candidates");
            this.partnerIceCandidates.forEach(c => {
                this.PC.addIceCandidate(c)
            });
        }
    }
    protected sendIceCandidate = ({ candidate }) => {
        const { sendMessageToTargetClient, username, channel} = this;
        if (candidate) {
            sendMessageToTargetClient(new WebRTCIceCandidate({
                candidate,
                from: username,
            }, channel, this.partner));
        }
    }
    protected waitForIce = () => this.streamAwaiter
        .waitFor((m: WebRTCIceCandidate) => (
                m.payload.candidate &&
                m.payload.from === this.partner
            )
        )
        .then(ice => {
            console.log("wait for ice got ice", { ice,partners: this.partnerIceCandidates, this: this });
            const candidate = ice.payload.candidate;
            if (candidate) {
                if (this.PC.remoteDescription) {
                    this.PC.addIceCandidate(candidate);
                } else {
                    this.partnerIceCandidates.push(candidate);
                }
            }
        })
        .catch(e => console.log("receive ice error", { e }))
        .then(() => this.waitForIce())
}


export class RTCClientManager  {
    connections: { [k: string]: PartnerConnection} = {

    };

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
        this.streamAwaiter.waitFor<WebRTCOfferStreamResponse>(m => 
                (m as WebRTCOfferStreamResponse).payload.description && 
                !(m as any as WebRTCAnswerOfferResponse).payload.originalOfferFrom && 
                (m as WebRTCOfferStreamResponse).isResponse && 
                (m as WebRTCOfferStreamResponse).payload.from !== this.username
            )
            .then(async msg => {
                const potentialPartner = msg.payload.from;
                that.waitForRTCOffer()
                this.onOffer(potentialPartner, msg);
            }).catch(e => console.log("receive offer went wront", { e }));
    }
    private onOffer = (potentialPartner,msg)=>{
        if (!this.connections[potentialPartner]) {
            console.error("manager got new offer from unknown parnter", potentialPartner, { connections: this.connections, potentialPartner, msg, exists: !!this.connections[potentialPartner], this: this })
            this.connections[potentialPartner] = this.newConnection(potentialPartner);
        }else{
            console.error("manager got offer for existing conection", potentialPartner, { connections: this.connections, potentialPartner, msg, exists: !!this.connections[potentialPartner], this: this })
        }
        this.connections[potentialPartner].onOffer(msg);

    }
    private newConnection = (partner:string)=>{
        const conn = new PartnerConnection(
            this.username,
            this.getChannel(),
            partner,
            this.streamAwaiter,
            this.getVideoStream, 
            this.sendMessageToTargetClient,
            this.onTrackReceived
        );
        return conn;
    }
    broadCastOffer = (partnerNames:Array<string>)=>{
        console.log("broadcast", { partnerNames});
        partnerNames.forEach(p => (this.connections[p] = this.newConnection(p)) && this.connections[p].startOffering());
    }
}



