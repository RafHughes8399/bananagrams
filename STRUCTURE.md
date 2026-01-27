# Project Structure

```
game-server/
├── server.js                 # Backend server (Express + Socket.IO)
├── package.json              # Dependencies
├── .env                       # Configuration
├── API_EXAMPLES.md           # API reference
│
└── public/                   # Frontend (served as static files)
    ├── index.html            # Main HTML
    ├── css/
    │   └── style.css         # Styles
    └── js/
        └── client.js         # Client-side code
```

## File Descriptions

### Backend

**server.js**
- Express server setup
- Socket.IO configuration
- REST API endpoints (GET /api/health, GET /api/games, POST /api/games, GET /api/games/:gameId)
- Socket.IO event handlers (join_game, game_event, disconnect)
- In-memory data storage (games Map, players Map)

**package.json**
- Project dependencies: express, socket.io, cors, dotenv

**.env**
- Configuration: PORT, NODE_ENV, MAX_PLAYERS

### Frontend

**public/index.html**
- Canvas element for rendering
- UI container
- Script imports (Socket.IO, client.js)

**public/css/style.css**
- Basic styling for canvas and page layout

**public/js/client.js**
- Socket.IO initialization
- REST API fetch functions
- Socket event listeners
- Canvas rendering loop
- Game state management

## How to Extend

### Add a new REST endpoint

In **server.js**, add to the REST API section:
```javascript
app.get('/api/path', (req, res) => {
  res.json({ data: 'response' });
});
```

### Add a new Socket event

In **server.js**, add to the Socket.IO section:
```javascript
socket.on('event_name', (data) => {
  // Handle event
  io.to(gameId).emit('response_event', data);
});
```

In **client.js**, listen to the event:
```javascript
socket.on('response_event', (data) => {
  console.log(data);
});
```

### Add game rendering

In **public/js/client.js**, modify the `renderGame()` function:
```javascript
function renderGame() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add your rendering code here
  
  requestAnimationFrame(renderGame);
}
```

## Getting Started

1. `npm install`
2. `npm start`
3. Visit `http://localhost:3000`
4. Open browser console to see connection logs
5. Call `getAllGames()`, `createGame()`, etc in console to test

## Notes

- All game and player data is stored in-memory (lost on server restart)
- No database setup required
- Socket.IO handles real-time communication
- REST endpoints are for HTTP requests
- Modify .env to change PORT or MAX_PLAYERS
