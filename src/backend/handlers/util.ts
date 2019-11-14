import { DestinationTypes,MessageLike ,Response, SingleUserDestination} from "../../lib/messages/message"
import { HandledRequests } from "../../lib/messages/messages"
import { User } from "../../lib/store/user/user"
import { Store } from "../../lib/store/store"
const isDestinationServer = (d: DestinationTypes): d is DestinationTypes.server => (d as DestinationTypes.server) === DestinationTypes.server
const isDestinationChannel = (d: DestinationTypes): d is DestinationTypes.channel => (d as DestinationTypes.channel) === DestinationTypes.channel
const isDesinationSingleUser = (d: DestinationTypes): d is DestinationTypes.singleUser => (d as DestinationTypes.singleUser) === DestinationTypes.singleUser
const destinationTypeHandler = (d: MessageLike, singleUser, channelBroadCast) => {
    if (isDesinationSingleUser(d.destination.type)) {
        return singleUser();
    } else if (isDestinationChannel(d.destination.type)) {
        return channelBroadCast();
    } else if (isDestinationServer(d.destination.type)) {
        console.error("server message not implimented", { d });
    }else{
        console.error("unknown destination type",{d});
    }
}
export const simpleSendHandler = <Req extends HandledRequests, Res extends Response<Req>>(
    message: Req,
    user: User,
    responseMessage:()=> Res,
    { allowSingleUserDestination= true, allowChannelDestination= true,echo = true }={}
) => destinationTypeHandler(message,
    () => {
        if (allowSingleUserDestination) {
            
            const channel = user.channels.getByName((message.destination as SingleUserDestination).val.channel);
            const otherUserName = (message.destination as SingleUserDestination).val.user;
            const otherUser = channel.users.getBy(u => u.username === otherUserName);
            if(otherUser && channel){
                (
                    echo ?
                        [otherUser, user]
                        :
                        [otherUser]
                ).forEach(u => u.writeToAllSockets(responseMessage()))
            }else{
                console.error("attempted to send message to invalid channel/user combo",{message,user,otherUser,channel,otherUserName})
            }

        } else {
            console.error("single user message not implimented", { message, user });
        }
    },
    () => {
        if (allowChannelDestination) {
            const channel = user.channels.getByName(message.destination.val.channel);
            if (channel) {
                channel.forEachUser(u => u.writeToAllSockets(responseMessage()))
            }else{
                console.error("attempted to send to channel user not in",{message,user,channel});
            }
        } else {
            console.error("channel message not implimented", { message, user });
        }
    }
)