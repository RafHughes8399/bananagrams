// Client setup
const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');

// Game state
const gameState = {
  gameId: null,
  playerId: null,
  players: new Map()
};

// ==================== SOCKET.IO EXAMPLES ====================

socket.on('connect', () => {
  console.log('Connected to server');
  ui.innerHTML = '<p>Connected</p>';
});

// Example: Listen for player joined
socket.on('player_joined', (data) => {
  console.log('Player joined:', data);
});

// Example: Listen for game event
socket.on('game_event', (data) => {
  console.log('Game event:', data);
});

socket.on('error', (message) => {
  console.error('Error:', message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// ==================== REST API EXAMPLES ====================

// Example: Fetch all games
async function getAllGames() {
  try {
    const response = await fetch('/api/games');
    const data = await response.json();
    console.log('All games:', data.games);
    return data.games;
  } catch (error) {
    console.error('Error fetching games:', error);
  }
}

// Example: Create a new game
async function createGame() {
  try {
    const response = await fetch('/api/games', { method: 'POST' });
    const data = await response.json();
    gameState.gameId = data.gameId;
    console.log('Game created:', data.gameId);
    return data.gameId;
  } catch (error) {
    console.error('Error creating game:', error);
  }
}

// Example: Get specific game
async function getGame(gameId) {
  try {
    const response = await fetch(`/api/games/${gameId}`);
    const data = await response.json();
    console.log('Game details:', data);
    return data;
  } catch (error) {
    console.error('Error fetching game:', error);
  }
}

// Example: Join game via socket
function joinGame(gameId, playerId) {
  socket.emit('join_game', { gameId, playerId });
}

// Example: Send custom event
function sendGameEvent(eventData) {
  socket.emit('game_event', eventData);
}

// ==================== CANVAS SETUP ====================

function renderGame() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add your rendering code here

  requestAnimationFrame(renderGame);
}

// Start rendering
renderGame();