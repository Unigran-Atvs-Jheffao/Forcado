import express from 'express'
import { initWs } from './ws'
import { Game } from './models/Game'
import { Lobby } from './models/Lobby'
import { Player } from './models/Player'

const app = express()
const port = 3000

app.use("static",express.static("static"))

app.get("/test/", (req,res) => {
  var thing = new Game(new Lobby(), new Player());
  thing.guessLetter("a")
  thing.guessLetter("i")
  console.log(thing);
  res.send("aWa")
})

const server = app.listen(port, () => {
  console.log(`App de exemplo esta rodando na porta ${port}`)
})


initWs(server);