import { match,when,def } from "../../util/switchExp";
import { Sockets } from "../sockets/sockets";
import { MessageTypes, Message } from "../../messages/message";

export const messageHandler = (message: Message, sockets: Sockets) => match(message.type,
    when(MessageTypes.channelCommand, ()=> { console.log("hi cc"); return "channel" }),
    when(MessageTypes.textMessage, () => { console.log("hi tm"); sockets.forEachSocket(s=>s.write(message.payload)) }),
    def(console.log("unmatched", { message}))
);
