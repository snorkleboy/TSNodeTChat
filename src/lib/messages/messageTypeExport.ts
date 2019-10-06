
import {HandledRequests,HandledResponses} from "./messages";
import {MessageLike} from "./message";
import { TypeMapper } from "../util/typeMapper";
import {  Store } from "../store/store";
import { User } from "../store/user/user";
export type MessageHandlerGen<M extends HandledRequests> = (message: M, store: Store, user: User) => void;
export type MessageHandler = MessageHandlerGen<HandledRequests>


type RequestTypeActionHandlerMapType<M extends HandledRequests> = {
    [messageType in M["type"]]: {
        [actionType in TypeMapper<M>[messageType]['action']]: M extends { action: actionType, type: messageType } ?
        MessageHandlerGen<M>
        :
        never
    }
};

type RequestToResponseConverter<Req, Res> = (req: Req, originatingUser: User) => Res;

type RequestResponseMakerMap<Req extends MessageLike, Res extends MessageLike> = {
    [messageType in Req['type']]:{
        [actionType in TypeMapper<Req>[messageType]['action']]: Req extends {type:messageType,action:actionType}?
        Res extends { type: messageType, action: actionType }?
            RequestToResponseConverter<Req,Res>
            :undefined
        :
        undefined
    }
}
export type RequestTypeActionResolver = RequestTypeActionHandlerMapType<HandledRequests>;
export type RequestToResponseConverterMap = RequestResponseMakerMap<HandledRequests,HandledResponses>;
export type ResponseMapper = <Req extends HandledRequests, Res extends HandledResponses>  (req: Req) => RequestToResponseConverterMap[Req['type']] extends { [k in Res['action']]: RequestToResponseConverter<Req,Res>}?
    Res extends {type:Req['type'],action:Req['action']}? (user: User) => Res:undefined
    : undefined
;
