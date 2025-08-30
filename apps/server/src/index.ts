import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  logger
} from '@tcgconnect/shared';
import { GameManager } from './game/GameManager';
import { SocketHandlers, TypedSocket } from './sockets/socketHandlers';

const app = express();
const server = createServer(app);

// Typed Socket.io server
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize game manager and socket handlers
const gameManager = new GameManager(io);
const socketHandlers = new SocketHandlers(io, gameManager);

// Health check endpoint with server stats
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stats: {
      activeGames: gameManager.getActiveGamesCount(),
      totalPlayers: gameManager.getTotalPlayersCount(),
      connectedSockets: io.sockets.sockets.size
    }
  });
});

// Create game endpoint (for testing)
app.post('/api/games', (req, res) => {
  try {
    const gameId = gameManager.createGame();
    res.json({ gameId, success: true });
  } catch (error) {
    logger.error('Error creating game', { error });
    res.status(500).json({ error: 'Failed to create game', success: false });
  }
});

// Socket.io connection handling
io.on('connection', (socket: TypedSocket) => {
  socketHandlers.handleConnection(socket);
});

server.listen(PORT, () => {
  logger.info(`TCGConnect server running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});