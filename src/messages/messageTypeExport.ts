import { TextMessagePostRequest, ChannelPostRequest, ChannelGetRequest, TextMessagePostResponse, ChannelPostResponse} from "./message";
import { TypeMapper } from "../util/typeMapper";
export type HandledRequests =
    | TextMessagePostRequest
    | ChannelPostRequest
    | ChannelGetRequest
export type HandledResponses = TextMessagePostResponse | ChannelPostResponse;

type HandledRequestResponses<Responses extends HandledResponses> = {
    [messageType in Responses['type']]: {
        [actionType in TypeMapper<Responses>[messageType]['action']]: Responses extends { type: messageType, action: actionType } ? Responses : never;
    }
}
export type HandledResponsesMap = HandledRequestResponses<HandledResponses>;