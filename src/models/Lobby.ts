import { Game } from "./Game";
import { Player } from "./Player";

export class Lobby {
    roomId: string
    players: Player[]

    maxWords: number = 0;

    public requestWord(game: Game,player:Player){
        player.currentWordCount += 1;
        if(player.currentWordCount != this.maxWords - 1){
            game.getNewWord("something")
        }else {
            game.finish();
        }
    }
}