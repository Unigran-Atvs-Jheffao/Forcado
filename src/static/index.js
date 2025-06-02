const joinScreen = document.getElementById('join-screen');
const gameScreen = document.getElementById('game-screen');
const roomCodeSpan = document.getElementById('room-code');
const wordDisplay = document.getElementById('word');
const multiplierDisplay = document.getElementById('multiplier');
const wordIndexDisplay = document.getElementById('word-index');
const guessedLetters = document.getElementById('guessed-letters');
const scoresList = document.getElementById('scores-list');
const gameOverDiv = document.getElementById('game-over');
const guessInput = document.getElementById('guess-input');
const guessBtn = document.getElementById('guess-btn');
const nameInput = document.getElementById('name');
const roomInput = document.getElementById('room');
const joinBtn = document.getElementById('join-btn');

let socket;
let currentRoom;
let playerId;

joinBtn.onclick = () => {
    const name = nameInput.value.trim();
    const room = roomInput.value.trim().toUpperCase();

    if (!name) {
        alert('Please enter your name');
        return;
    }

    socket = new WebSocket(`ws://${window.location.host}`);

    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: 'join',
            name,
            room: room || null
        }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'error') {
            alert(data.message);
            socket.close();
        }

        if (data.type === 'joined') {
            playerId = data.playerId;
            currentRoom = data.roomId;
            roomCodeSpan.textContent = currentRoom;
            joinScreen.style.display = 'none';
            gameScreen.style.display = 'block';
            gameOverDiv.textContent = '';
            guessInput.value = '';
            guessInput.focus();
        }

        if (data.type === 'new_word') {
            // Show masked word spaced out
            wordDisplay.textContent = data.word.split('').join(' ');
            multiplierDisplay.textContent = `Multiplier: ${data.multiplier}`;
            wordIndexDisplay.textContent = `Word ${data.wordIndex} of ${data.totalWords}`;
            guessedLetters.textContent = "";
            gameOverDiv.textContent = '';
            guessInput.value = '';
            guessInput.focus();
        }

        if (data.type === 'update') {
            wordDisplay.textContent = data.word.split('').join(' ');
            multiplierDisplay.textContent = `Multiplier: ${data.multiplier}`;
            guessInput.value = '';
            guessInput.focus();
        }

        if (data.type === 'scores_update') {
            scoresList.innerHTML = '';
            data.scores.forEach(({ name, score, multiplier }) => {
                const li = document.createElement('li');
                li.textContent = `${name}: ${score} pts (x${multiplier})`;
                scoresList.appendChild(li);
            });
        }

        if (data.type === 'game_over') {
            gameOverDiv.textContent = data.message;
            wordDisplay.textContent = '';
            multiplierDisplay.textContent = '';
            wordIndexDisplay.textContent = '';
        }
    };

    socket.onclose = () => {
        alert('Disconnected from server');
        joinScreen.style.display = 'block';
        gameScreen.style.display = 'none';
    };
};

guessBtn.onclick = () => {
    const guess = guessInput.value.trim().toLowerCase();
    if (guess.length !== 1 || !guess.match(/[a-z]/i)) {
        alert('Please enter a single letter (a-z)');
        guessInput.value = '';
        guessInput.focus();
        return;
    }

    let values = guessedLetters.textContent.split(" ");
    values.push(guess);
    guessedLetters.textContent = values.sort().join(" ")

    socket.send(JSON.stringify({
        type: 'guess',
        room: currentRoom,
        guess
    }));
};

// Optional: Allow Enter key to submit guess
guessInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        guessBtn.click();
    }
});