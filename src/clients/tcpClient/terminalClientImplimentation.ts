import { Socket } from "net";
import { TCPClient } from "./tcpClient";
var net = require('net');
const readline = require('readline');
const createRLInterface = () => {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}
const clear = () => {
    const lines = process.stdout.getWindowSize()[1];
    console.log('-------\n');
    for (var i = 0; i < lines + 2; i++) {
        console.log('\r\n');
    }
    console.log('--------\n');
}

export const startClient = (port, address) => {
    const debug = false;
    const rl = createRLInterface();
    const hostConnection: Socket = new net.Socket();
    hostConnection.on('close', function () {
        console.log('Connection closed');
        rl.close();
    });

    hostConnection.connect(port, address, function () {
        console.log('Connected');
        const tcpClient = new TCPClient(
            {
                sendToClient: (msg) => {
                    clear();
                    process.stdout.write(msg)
                },
                sendToServer: (msg) => {
                    const txt = JSON.stringify(msg);
                    hostConnection.write(txt);
                }
            },
        );
        hostConnection.on("data", chunk => {
            try {
                const json = JSON.parse(chunk.toString());
                tcpClient.receiveFromServer(json)
            } catch (error) {
                if (this.debug) {
                    console.warn("couldnt parse message");
                }
            }
        });
        rl.on('line', (input) => {
            tcpClient.receiveFromClient(input);
        });
        tcpClient.start()
            .then(m => console.log("authenticated", { m }, "\n"))
    });
}
