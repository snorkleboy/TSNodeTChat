import {Sockets} from "./sockets"
import { messageHandler as defaultMessageHandler} from "../messages/messageHandler"
function socketConfigurer(thisId, socket, socketStore: Sockets, messageHandler ) {
    socket.setEncoding('utf8');
    socketStore.addSocket(thisId, socket);
    socket.on('data', (receivedDataChunk) => {
        const data = receivedDataChunk.toString('utf8');
        console.log({ data  });
        messageHandler(data, socketStore);
    });
    socket.on('end', () =>{
        console.log('Closing connection with the client', { socketStore })
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
