import { PureComponent } from "react";
import { WebRTCOfferStream, WebRTCAnswerOffer, WebRTCIceCandidate, WebRTCAnswerOfferResponse, WebRTCOfferStreamResponse, WebRTCDWSStreamFrame } from "../../lib/messages/messages";
import {StreamAwaiter} from "../tcpClient/streamAwaiter"
import { DestinationTypes, ActionTypes, MessageLike, Response, SingleUserDestination } from "../../lib/messages/message";
import CanvasASCII from "jw-canvas-ascii";
var asciiPixels = require('ascii-pixels')

const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
    }]
};
class DWSPartner{
    fps:number = null;
    intervalRef = null;

    constructor(
        public downGradeMessage:WebRTCAnswerOfferResponse,
        public getData,
        partnerConnection: PartnerConnection,
        public send=partnerConnection.sendMessageToTargetClient,
        public partner = partnerConnection.partner,
        public channel = partnerConnection.channel,
        public username = partnerConnection.username,
    )
    {
        this.fps = downGradeMessage.payload.description.fps||15;
        this.startSending();
    }
    startSending = ()=>{
        const w = this.downGradeMessage.payload.description.width;
        const h = this.downGradeMessage.payload.description.height;
        this.intervalRef = setInterval(
            async ()=>this.send(
                new WebRTCDWSStreamFrame(this.downGradeMessage,{
                    from: this.username,
                    video: (await this.getData(w,h)).video
                })
            )
            ,
            1000/this.fps
        )
    }
    onOffer=()=>{console.error("not implimented")}
}
class PartnerConnection{
    localDescription
    foreignDescription
    PC
    offering=false;
    recieving=false;
    partnerIceCandidates=[]
    constructor(
        public username: string,
        public channel: string,
        public partner: string,
        public streamAwaiter: StreamAwaiter,
        public getVideoStream,
        public sendMessageToTargetClient,
        public onTrackReceived,
        public onDownGradeToDWS
    ){
        this.PC = new RTCPeerConnection(configuration);
        this.PC.onicecandidate = this.sendIceCandidate;
        this.PC.onnegotiationneeded = this.sendOffer;
        this.PC.ontrack = this.onTrack;
        this.waitForIce();
    }
    startOffering = async () => {
        if(!this.offering){
            console.log("start offering", this)
            this.offering = true;
            const stream = await this.getVideoStream();
            stream.getTracks().forEach((track) => this.PC.addTrack(track, stream));
            return stream;
        }
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
        this.recieving = true;
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
            if(answer.payload.directWS){
                this.onDownGradeToDWS(answer)
            }else{
                return this.PC.setRemoteDescription(this.foreignDescription)
                    .catch(e => console.error("ON ASWERtry set remote desc failed", { answer, e, this: this }))
            }
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
class LocalVideoCanvasCache{
    canvas = document.createElement('canvas');
    latestFrame:string = null;
    // latestAccess:number = null;
    constructor(public video){
        document.body.appendChild(this.canvas);
    }
    getFrame = (w,h)=>{
        const d = Date.now();
        // if(this.latestFrame && d-this.latestAccess> (1000/30)){
            // return this.latestFrame;
        // }else{
            this._getFrame(w,h);
            return this.latestFrame
        // }
    }
    _getFrame = (w,h)=>{
        const canvas = this.canvas;
        canvas.width = w||100;
        canvas.height = h||100;

        const ctx = canvas.getContext('2d')
        ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height );
        this.latestFrame = asciiPixels(ctx.getImageData(0, 0, canvas.width, canvas.height )) ;
        // this.latestAccess = Date.now();
    }
}

export class RTCClientManager  {
    connections: { [k: string]: PartnerConnection|DWSPartner} = {

    };
    localVideoDWSCache: LocalVideoCanvasCache = null;
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
            console.log("manager got new offer from unknown parnter", potentialPartner, { connections: this.connections, potentialPartner, msg, exists: !!this.connections[potentialPartner], this: this })
            this.connections[potentialPartner] = this.newConnection(potentialPartner);
        }else{
            console.log("manager got offer for existing conection", potentialPartner, { connections: this.connections, potentialPartner, msg, exists: !!this.connections[potentialPartner], this: this })
        }
        this.connections[potentialPartner].onOffer(msg);

    }
    private getVideoData = async (w,h)=>{
        if (!this.localVideoDWSCache){
            const s = await (this.getVideoStream());
            console.log({ref:s});
            this.localVideoDWSCache = new LocalVideoCanvasCache(s.ref.current)
        }
        return {video:this.localVideoDWSCache.getFrame(w,h)};
    }
    private newConnection = (partner:string)=>{
        const conn = new PartnerConnection(
            this.username,
            this.getChannel(),
            partner,
            this.streamAwaiter,
            async ()=>{
                const str = (await this.getVideoStream()).stream;
                console.log("get videostream (rtcmanager)",{str});
                return str;
            }, 
            this.sendMessageToTargetClient,
            this.onTrackReceived,
            (msg)=>{
                console.log("downgrade",{msg});
                this.connections[partner] = new DWSPartner(msg, this.getVideoData,conn)
            }
        );
        return conn;
    }
    broadCastOffer = (partnerNames:Array<string>)=>{
        console.log("broadcast", { partnerNames});
        partnerNames.forEach(p => (this.connections[p] = this.newConnection(p)) && (this.connections[p] as PartnerConnection).startOffering());
    }
}



