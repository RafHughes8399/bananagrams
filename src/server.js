import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS) || 6;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// In-memory storage
const games = new Map();
const players = new Map();

// ==================== REST API EXAMPLES ====================

// Example: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Example: Get all games
app.get('/api/games', (req, res) => {
  const gamesList = Array.from(games.values()).map(game => ({
    id: game.id,
    playerCount: game.players.length,
    maxPlayers: MAX_PLAYERS,
    createdAt: game.createdAt
  }));
  res.json({ games: gamesList });
});

// Example: Create a new game
app.post('/api/games', (req, res) => {
  const gameId = Math.random().toString(36).substr(2, 9);
  const game = {
    id: gameId,
    players: [],
    createdAt: new Date()
  };
  games.set(gameId, game);
  res.json({ gameId });
});

// Example: Get specific game
app.get('/api/games/:gameId', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json({
    id: game.id,
    playerCount: game.players.length,
    players: game.players
  });
});

// ==================== SOCKET.IO EXAMPLES ====================

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  // Example: Join game event
  socket.on('join_game', (data) => {
    const { gameId, playerId } = data;
    const game = games.get(gameId);

    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    if (game.players.length >= MAX_PLAYERS) {
      socket.emit('error', 'Game is full');
      return;
    }

    const player = { id: socket.id, playerId, gameId };
    players.set(socket.id, player);
    game.players.push(player);
    socket.join(gameId);

    io.to(gameId).emit('player_joined', { playerId: socket.id });
  });

  // Example: Custom event
  socket.on('game_event', (data) => {
    const player = players.get(socket.id);
    if (player) {
      io.to(player.gameId).emit('game_event', data);
    }
  });

  // Example: Disconnect
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      const game = games.get(player.gameId);
      if (game) {
        game.players = game.players.filter(p => p.id !== socket.id);
      }
      players.delete(socket.id);
    }
    console.log(`Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});