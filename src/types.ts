
// rooms structure: 
// { roomId: { 
//    players: { playerId: { ws, name, score, multiplier, guessed, wordIndex } }, 
//    wordPool: [words], 
//  } 

import WebSocket from "ws";

// }
export interface Rooms {
    [roomId: string]: Room;
}

export interface Room {
    players:  Players,
    wordPool: string[]
}

export interface Players{
    [playerId: string]: Player
}

export interface Player {
    ws: WebSocket
    name: string,
    score: number,
    multiplier: number,
    guessed: string[]
    wordIndex: number
}
