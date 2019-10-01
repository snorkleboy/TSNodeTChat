import { startServer} from "./server";
const {tcpServer,httpServer} = startServer();
tcpServer.on("error", (e) => console.error("tcp server",{ e }));
