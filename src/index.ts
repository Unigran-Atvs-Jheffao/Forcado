import { Player, Room } from "./types";

const express = require('express');
const http = require('http');
const ws = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use("/", express.static(__dirname + "/static/"));
const server = http.createServer(app);
const wss = new ws.Server({ server });

const PORT = 25565;

const words = [
	"amor", "amigo", "banco", "bola", "branco", "cafe", "calor", "cama", "carro", "carta",
	"cidade", "claro", "correr", "costa", "dedo", "deus", "dizer", "doce", "escola", "falar",
	"feliz", "festa", "filho", "flor", "fraco", "frio", "garfo", "gato", "gente", "grande",
	"homem", "hoje", "jogo", "lento", "letra", "livro", "luz", "mãe", "mão", "mar",
	"mesa", "noite", "novo", "olho", "ouvir", "pai", "paz", "peixe", "porta", "verde"
];

var rooms: Room | {} = {};
// rooms structure: 
// { roomId: { 
//    players: { playerId: { ws, name, score, multiplier, guessed, wordIndex } }, 
//    wordPool: [words], 
//  } 
// }

function maskWord(word: string, guessed: string[] = []): string {
	return word.split('').map((c: string) => guessed.includes(c) ? c : '_').join('');
}

function broadcast(roomId: string, data: any) {
	const room = rooms[roomId] as Room;
	if (!room) return;
	Object.values(room.players).forEach((p: Player) => {
		if (p.ws.readyState === p.ws.OPEN) {
			p.ws.send(JSON.stringify(data));
		}
	});
}

// Helper: send scores to all players in the room
function sendScores(roomId: string) {
	const room = rooms[roomId] as Room;
	if (!room) return;
	const scores = Object.values(room.players).map(p => ({
		name: p.name,
		score: p.score,
		multiplier: p.multiplier || 1
	}));
	broadcast(roomId, { type: 'scores_update', scores });
}

wss.on('connection', ws => {
	let playerId, roomId;

	ws.on('message', message => {
		const data = JSON.parse(message);

		if (data.type === 'join') {
			playerId = uuidv4();
			roomId = data.room ? data.room.toUpperCase() : uuidv4().slice(0, 5).toUpperCase();
			const name = data.name || 'Player';

			if (!rooms[roomId]) {
				// Create room and generate a random pool of 10 words in a fixed order
				const shuffled = words
					.map(w => ({ w, sort: Math.random() }))
					.sort((a, b) => a.sort - b.sort)
					.slice(0, 10)
					.map(o => o.w);
				rooms[roomId] = { players: {}, wordPool: shuffled };
			}

			if (Object.keys(rooms[roomId].players).length >= 4) {
				ws.send(JSON.stringify({ type: 'error', message: 'Room full.' }));
				return;
			}

			// Initialize player data
			rooms[roomId].players[playerId] = {
				ws,
				name,
				score: 0,
				multiplier: 1,
				guessed: [],
				wordIndex: 0,
			};

			ws.send(JSON.stringify({ type: 'joined', roomId, playerId }));

			// Send first word immediately on join for the player
			sendPlayerWord(roomId, playerId);
			sendScores(roomId);
		}

		if (data.type === 'guess') {
			const room = rooms[data.room];
			if (!room) return;

			const player = room.players[playerId];
			if (!player) return;

			const guess = data.guess.toLowerCase();
			if (!player.guessed.includes(guess)) {
				player.guessed.push(guess);

				const currentWord = room.wordPool[player.wordIndex - 1]; // current word is at wordIndex-1
				const newMasked = maskWord(currentWord, player.guessed);

				if (newMasked.includes(guess)) {
					// Correct guess: increase multiplier and score
					player.multiplier++;
					player.score += 10 * player.multiplier;
				} else {
					// Wrong guess: reset multiplier but do NOT advance word
					player.multiplier = 1;
				}

				// Send update only to this player
				if (player.ws.readyState === player.ws.OPEN) {
					player.ws.send(JSON.stringify({
						type: 'update',
						word: newMasked,
						multiplier: player.multiplier
					}));
				}

				sendScores(data.room);

				// Advance word only if fully guessed
				if (!newMasked.includes('_')) {
					setTimeout(() => sendPlayerWord(data.room, playerId), 1000);
				}
			}
		}
	});

	ws.on('close', () => {
		if (rooms[roomId] as Room && rooms[roomId].players[playerId]) {
			delete rooms[roomId].players[playerId];
			if (Object.keys(rooms[roomId].players).length === 0) {
				delete rooms[roomId];
			} else {
				sendScores(roomId);
			}
		}
	});
});

function sendPlayerWord(roomId, playerId) {
	const room = rooms[roomId] as Room;
	if (!room) return;
	const player = room.players[playerId] as Player;
	if (!player) return;

	if (player.wordIndex >= room.wordPool.length) {
		if (player.ws.readyState === player.ws.OPEN) {
			player.ws.send(JSON.stringify({
				type: 'game_over',
				message: `Game over! Your final score: ${player.score}`
			}));
		}
		return;
	}

	const word = room.wordPool[player.wordIndex];
	player.guessed = [];

	if (player.ws.readyState === player.ws.OPEN) {
		player.ws.send(JSON.stringify({
			type: 'new_word',
			word: maskWord(word),
			multiplier: player.multiplier,
			wordIndex: player.wordIndex + 1,  // 1-based index for UI
			totalWords: room.wordPool.length
		}));
	}

	player.wordIndex++;
}

server.listen(PORT, () => console.log(`Server running on http://127.0.0.1:${PORT}`));
