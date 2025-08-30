import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  GameState,
  Player,
  GameRoom,
  GameConfig,
  generateId,
  isValidPlayerRole,
  isValidPlayerName,
  isValidGameId,
  logger
} from '@tcgconnect/shared';

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private rooms: Map<string, GameRoom> = new Map();
  private playerToGame: Map<string, string> = new Map();

  constructor(private io: SocketIOServer) {}

  // Create a new game room
  createGame(config: GameConfig = { maxPlayers: 2, allowReconnection: true }): string {
    const gameId = generateId();
    const now = new Date();
    
    const gameState: GameState = {
      id: gameId,
      players: [],
      currentTurn: '',
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
    };

    const room: GameRoom = {
      id: gameId,
      playerSocketIds: new Map(),
      maxPlayers: config.maxPlayers,
    };

    this.games.set(gameId, gameState);
    this.rooms.set(gameId, room);

    logger.info('Created game room', { gameId });
    return gameId;
  }

  // Handle player joining a game
  async joinGame(
    socket: Socket,
    data: { gameId: string; playerName: string; role: 'host' | 'player1' | 'player2' }
  ): Promise<{ success: boolean; message?: string }> {
    const { gameId, playerName, role } = data;

    // Validation
    if (!isValidGameId(gameId)) {
      return { success: false, message: 'Invalid game ID' };
    }

    if (!isValidPlayerName(playerName)) {
      return { success: false, message: 'Invalid player name' };
    }

    if (!isValidPlayerRole(role)) {
      return { success: false, message: 'Invalid player role' };
    }

    const gameState = this.games.get(gameId);
    const room = this.rooms.get(gameId);

    if (!gameState || !room) {
      return { success: false, message: 'Game not found' };
    }

    // Check if role is already taken
    const existingPlayer = gameState.players.find(p => p.role === role);
    if (existingPlayer && existingPlayer.connected) {
      return { success: false, message: 'Role already taken' };
    }

    // Check room capacity
    if (gameState.players.length >= room.maxPlayers && !existingPlayer) {
      return { success: false, message: 'Game is full' };
    }

    // Join the socket to the room
    await socket.join(gameId);

    // Create or update player
    const playerId = existingPlayer?.id || generateId();
    const player: Player = {
      id: playerId,
      name: playerName.trim(),
      role,
      connected: true,
      joinedAt: existingPlayer?.joinedAt || new Date(),
    };

    // Update socket data
    socket.data.playerId = playerId;
    socket.data.gameId = gameId;
    socket.data.playerName = playerName;
    socket.data.role = role;

    // Update game state
    if (existingPlayer) {
      // Reconnection
      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      gameState.players[playerIndex] = player;
    } else {
      // New player
      gameState.players.push(player);
    }

    // Update room tracking
    room.playerSocketIds.set(playerId, socket.id);
    if (role === 'host') {
      room.hostSocketId = socket.id;
    }

    this.playerToGame.set(playerId, gameId);

    // Start game if we have enough players
    if (gameState.status === 'waiting' && gameState.players.length >= 2) {
      gameState.status = 'active';
      gameState.currentTurn = gameState.players.find(p => p.role === 'player1')?.id || '';
    }

    gameState.updatedAt = new Date();

    // Notify all clients in the room
    this.io.to(gameId).emit('game:update', gameState);
    this.io.to(gameId).emit('player:connected', player);

    logger.info('Player joined game', { playerName, role, gameId });
    return { success: true };
  }

  // Handle player leaving a game
  async leaveGame(socket: Socket): Promise<void> {
    const { playerId, gameId } = socket.data;

    if (!playerId || !gameId) return;

    const gameState = this.games.get(gameId);
    const room = this.rooms.get(gameId);

    if (!gameState || !room) return;

    // Mark player as disconnected
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
      player.connected = false;
    }

    // Remove from room tracking
    room.playerSocketIds.delete(playerId);
    if (socket.data.role === 'host') {
      room.hostSocketId = undefined;
    }

    // Leave socket room
    await socket.leave(gameId);

    // Clean up mappings
    this.playerToGame.delete(playerId);

    gameState.updatedAt = new Date();

    // Notify remaining players
    this.io.to(gameId).emit('game:update', gameState);
    this.io.to(gameId).emit('player:disconnected', playerId);

    // Clean up empty games (after a delay to allow reconnection)
    setTimeout(() => {
      this.cleanupEmptyGame(gameId);
    }, 30000); // 30 second grace period

    logger.info('Player left game', { playerName: socket.data.playerName, gameId });
  }

  // Get game state
  getGameState(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  // Broadcast game update
  broadcastGameUpdate(gameId: string): void {
    const gameState = this.games.get(gameId);
    if (gameState) {
      gameState.updatedAt = new Date();
      this.io.to(gameId).emit('game:update', gameState);
    }
  }

  // Clean up empty games
  private cleanupEmptyGame(gameId: string): void {
    const gameState = this.games.get(gameId);
    if (!gameState) return;

    const connectedPlayers = gameState.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
      this.games.delete(gameId);
      this.rooms.delete(gameId);
      logger.debug('Cleaned up empty game', { gameId });
    }
  }

  // Get active games count (for monitoring)
  getActiveGamesCount(): number {
    return Array.from(this.games.values()).filter(
      game => game.status === 'active'
    ).length;
  }

  // Get total players count (for monitoring)
  getTotalPlayersCount(): number {
    return Array.from(this.games.values()).reduce(
      (total, game) => total + game.players.filter(p => p.connected).length,
      0
    );
  }
}