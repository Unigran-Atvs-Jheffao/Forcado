import { Lobby } from "./Lobby";
import { Player } from "./Player";

export class Game {
    player: Player
    lobby: Lobby
    score: number;
    currentWord: string
    currentWordGuess: string
    letterGuesses: string
    comboCounter: number
    

    constructor(lobby: Lobby, player: Player){
        this.player = player
        this.lobby = lobby;
        this.comboCounter = 0;
        this.score = 0;
        this.letterGuesses = ""
    }

    guessLetter(letter:String){
        this.letterGuesses += letter;
        
        let old = this.currentWordGuess;

        this.currentWordGuess = [...this.currentWordGuess].map(
            (val, idx) => {
                if(this.currentWord[idx] == letter){
                    this.score += (100 * (1+this.comboCounter))
                    return letter;
                }
                return val
            }
        ).join("");

        if(old != this.currentWordGuess){
            this.comboCounter++
        }else{
            this.comboCounter = 0
        }

        if(this.currentWordGuess == this.currentWord){
            this.requestNewWordOrFinish();
        }
    }

    public requestNewWordOrFinish(){
        this.lobby.requestWord(this, this.player)
    }

    public getNewWord(word: string){
        this.currentWord = word;
        this.currentWordGuess = word.replace(new RegExp("[a-zA-Zç]","g"), "_")
    }

    public finish(){
        this.player.score = this.score;
    }
}