import { RequestTypeActionToHandlerMap} from "../../lib/messages/messageTypeExport";
import { MessageTypes, ActionTypes, DestinationTypes, Destination, MessageLike, Response } from "../../lib/messages/message";
import { TextMessagePostResponse, ChannelPostResponse, ChannelGetResponse, WebRTCOfferStreamResponse, HandledRequests, WebRTCAnswerOfferResponse, WebRTCDWSStreamResponse } from "../../lib/messages/messages";
import { Channel } from "../../lib/store/channel/channel";
import { Store } from "../../lib/store/store";
import { User } from "../../lib/store/user/user";
import { simpleSendHandler } from "./util";

const isWebRTCAnswerOffer = message=>(message as WebRTCAnswerOfferResponse).payload.originalOfferFrom

export const requestTypeActionHandlerMap: RequestTypeActionToHandlerMap = {
    [MessageTypes.textMessage]: {
        [ActionTypes.post]: (message, user) => simpleSendHandler(
            message,user,
            ()=>new TextMessagePostResponse(message, user),
            {allowSingleUserDestination:false}
        )
    },
    [MessageTypes.channelCommand]: {
        [ActionTypes.post]: (message, user) => {
            const { channelName, switchTo } = message.payload;
            if (switchTo) {
                user.channels.forEach(channel => channel.removeUser(user));
            }
            const {channel,isNew} = Channel.getOrCreateChannel(channelName);
            channel.addUser(user);
            const res = new ChannelPostResponse(message, user);
            if (isNew){
                res.payload.isNew = true;
                Store.getStore().users.forEach(u => u.writeToAllSockets(res))
            }else{
                channel.forEachUser(u => u.writeToAllSockets(res))
            }
        },
        [ActionTypes.get]: (message, user) => {
            user.writeToAllSockets(new ChannelGetResponse(message,user));
        }
    },
    [MessageTypes.WRTCAV]: {
        [ActionTypes.post]: (m, u) => simpleSendHandler(
            m, u,
            () => new WebRTCDWSStreamResponse(m),
            { allowChannelDestination: false }
        ),
        [ActionTypes.offer]: (message, user) => simpleSendHandler(
            message,user,
            () => isWebRTCAnswerOffer(message)  ? 
                new WebRTCAnswerOfferResponse(message) 
            :
                new WebRTCOfferStreamResponse(message)
        ),
        // [ActionTypes.patch]: (message, user) => simpleSendHandler(
        //     message,user,
        //     ()=>new WebRTCRenegotiateResponse(message),
        //     { allowChannelDestination:false}
        // ),
        [ActionTypes.meta]: (message, user) => {
            const channel = user.channels.getByName(message.destination.val.channel);
            if (channel) {
                channel.forEachUser(u => u.writeToAllSockets(message))
            }
        }
    }
}
