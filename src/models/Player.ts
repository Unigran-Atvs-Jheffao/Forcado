export class Player {
    name: string
    ws: WebSocket
    currentWordCount: number = 0;
    score: number = 0;
}