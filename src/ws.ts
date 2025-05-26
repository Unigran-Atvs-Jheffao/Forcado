
import { WebSocketServer } from "ws";



export const initWs = (server) => {
    const wss = new WebSocketServer({
        server,
        path: "/ws"
    });

    console.log("Websocket Server Running");
}