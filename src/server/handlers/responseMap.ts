import { RequestToResponseConverterMap, HandledRequests, HandledResponses, ResponseMapper } from "../../messages/messageTypeExport";
import { MessageTypes, ActionTypes, TextMessagePostResponse, ChannelPostResponse } from "../../messages/message";
import { User } from "../store/user/user";
import { TypeMapper } from "../../util/typeMapper";

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
