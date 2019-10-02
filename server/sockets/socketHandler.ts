import {Sockets} from "./sockets"
import { messageHandler as defaultMessageHandler} from "../messageHandler/messageHandler"
function socketConfigurer(thisId, socket, socketStore: Sockets, messageHandler ) {
    socketStore.addSocket(thisId, socket);
    socket.on('data', (receivedDataChunk) => {
        try {
            const parsed = JSON.parse(receivedDataChunk);
            messageHandler(parsed, socketStore);
        } catch (error) {
            console.error({ error,receivedDataChunk});
        }

    });
    socket.on('end', () =>{
        console.log('Closing connection with the client')
        socketStore.removeSocket(thisId)
    });
    socket.on('error', err => console.log(`Error: ${err}`));
}

let currId: number = 0;
export const socketHandler = (
    socket,
    socketStore,
    messageHandler = defaultMessageHandler
) => socketConfigurer(currId++, socket, socketStore, messageHandler);
