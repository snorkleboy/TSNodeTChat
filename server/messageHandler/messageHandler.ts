import { match,when,def } from "../../util/switchExp";
import { Sockets } from "../sockets/sockets";
import { MessageTypes, IMessage } from "../../messages/message";

export const messageHandler = (message: IMessage, sockets: Sockets) => match(message.type,
    when(MessageTypes.channelCommand, ()=> { console.log("hi cc"); return "channel" }),
    when(MessageTypes.textMessage, () => { console.log("hi tm"); sockets.forEachSocket(s=>s.write(message.payload)) }),
    def(console.log("unmatched", { message}))
);
