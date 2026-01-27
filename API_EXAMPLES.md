# API Endpoint Examples

## REST API

### Get Health Check
```javascript
// Request
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log(data));

// Response
{
  "status": "ok",
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

### Get All Games
```javascript
// Request
fetch('/api/games')
  .then(res => res.json())
  .then(data => console.log(data));

// Response
{
  "games": [
    {
      "id": "abc12345",
      "playerCount": 2,
      "maxPlayers": 6,
      "createdAt": "2024-01-27T12:00:00.000Z"
    }
  ]
}
```

### Create a Game
```javascript
// Request
fetch('/api/games', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data));

// Response
{
  "gameId": "abc12345"
}
```

### Get Specific Game
```javascript
// Request
fetch('/api/games/abc12345')
  .then(res => res.json())
  .then(data => console.log(data));

// Response
{
  "id": "abc12345",
  "playerCount": 2,
  "players": [
    { "id": "socket-1", "playerId": "player1", "gameId": "abc12345" }
  ]
}
```

## Socket.IO Events

### Join Game
```javascript
// Client sends
socket.emit('join_game', {
  gameId: 'abc12345',
  playerId: 'player1'
});

// Server receives and broadcasts
socket.on('join_game', (data) => {
  // ... handle join
  io.to(gameId).emit('player_joined', { playerId: socket.id });
});

// All clients in game receive
socket.on('player_joined', (data) => {
  console.log('Player joined:', data);
});
```

### Custom Game Event
```javascript
// Client sends
socket.emit('game_event', {
  type: 'action_name',
  payload: { /* your data */ }
});

// Server receives and broadcasts
socket.on('game_event', (data) => {
  io.to(player.gameId).emit('game_event', data);
});

// All clients receive
socket.on('game_event', (data) => {
  console.log('Game event:', data);
});
```

## Usage in Your Code

### Frontend (public/js/client.js)

Call REST endpoints:
```javascript
// Create game
const gameId = await createGame();

// Get game details
const game = await getGame(gameId);

// Get all games
const games = await getAllGames();

// Join game via socket
joinGame(gameId, 'myPlayerId');

// Send custom event
sendGameEvent({ type: 'my_event', data: {} });
```

Listen to socket events:
```javascript
socket.on('player_joined', (data) => {
  // Handle player join
});

socket.on('game_event', (data) => {
  // Handle game event
});
```

### Backend (server.js)

Add REST endpoint:
```javascript
app.get('/api/myendpoint', (req, res) => {
  res.json({ result: 'data' });
});
```

Add Socket event:
```javascript
socket.on('my_event', (data) => {
  const player = players.get(socket.id);
  io.to(player.gameId).emit('response_event', responseData);
});
```

Broadcast to game:
```javascript
io.to(gameId).emit('event_name', data);
```

Send to specific player:
```javascript
io.to(socket.id).emit('event_name', data);
```
