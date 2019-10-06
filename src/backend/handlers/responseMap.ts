import { RequestToResponseConverterMap, ResponseMapper } from "../../lib/messages/messageTypeExport";
import { MessageTypes, ActionTypes } from "../../lib/messages/message";
import { TextMessagePostResponse, ChannelPostResponse } from "../../lib/messages/messages";

export const responseMap: RequestToResponseConverterMap = {
    [MessageTypes.textMessage]:{
        [ActionTypes.post]:(req,user)=>new TextMessagePostResponse(req,user)
    },
    [MessageTypes.channelCommand]:{
        [ActionTypes.post]:(req,user)=>new ChannelPostResponse(req,user),
        [ActionTypes.get]:null
    }
}

export const responseMaper: ResponseMapper = (req)=>{
    let converter = responseMap[req['type']][req['action']];
    if(converter){
        (user)=>converter(req,user);
    }
    return converter
}
