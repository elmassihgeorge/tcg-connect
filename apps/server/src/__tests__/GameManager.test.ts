import { GameManager } from '../game/GameManager';
import { Server as SocketIOServer } from 'socket.io';
// GameManager tests
import type { Socket } from 'socket.io';

// Mock socket implementation
const createMockSocket = (id: string = 'mock-socket-id'): Partial<Socket> => ({
  id,
  data: {},
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  disconnect: jest.fn(),
});

// Mock io implementation
const createMockIO = (): Partial<SocketIOServer> => ({
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  sockets: {
    sockets: new Map()
  } as any
});

describe('GameManager', () => {
  let gameManager: GameManager;
  let mockIO: Partial<SocketIOServer>;
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    mockIO = createMockIO();
    gameManager = new GameManager(mockIO as SocketIOServer);
    mockSocket = createMockSocket();
  });

  describe('createGame', () => {
    it('should create a new game with default configuration', () => {
      const gameId = gameManager.createGame();
      
      expect(gameId).toBeDefined();
      expect(typeof gameId).toBe('string');
      expect(gameId.length).toBeGreaterThan(0);
      
      const gameState = gameManager.getGameState(gameId);
      expect(gameState).toBeDefined();
      expect(gameState?.id).toBe(gameId);
      expect(gameState?.status).toBe('waiting');
      expect(gameState?.players).toHaveLength(0);
    });

    it('should create games with unique IDs', () => {
      const gameId1 = gameManager.createGame();
      const gameId2 = gameManager.createGame();
      
      expect(gameId1).not.toBe(gameId2);
    });

    it('should accept custom configuration', () => {
      const gameId = gameManager.createGame({ 
        maxPlayers: 4, 
        allowReconnection: false 
      });
      
      expect(gameId).toBeDefined();
      // Note: We can't directly test the room config without exposing it
      // This is testing that the method accepts the parameter without error
    });
  });

  describe('joinGame', () => {
    let gameId: string;

    beforeEach(() => {
      gameId = gameManager.createGame();
    });

    it('should allow a host to join a game', async () => {
      const result = await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Host Player',
        role: 'host'
      });

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith(gameId);
      
      const gameState = gameManager.getGameState(gameId);
      expect(gameState?.players).toHaveLength(1);
      expect(gameState?.players[0].name).toBe('Host Player');
      expect(gameState?.players[0].role).toBe('host');
      expect(gameState?.players[0].connected).toBe(true);
    });

    it('should allow players to join a game', async () => {
      const result1 = await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });

      const mockSocket2 = createMockSocket('socket-2');
      const result2 = await gameManager.joinGame(mockSocket2 as Socket, {
        gameId,
        playerName: 'Player 2', 
        role: 'player2'
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      const gameState = gameManager.getGameState(gameId);
      expect(gameState?.players).toHaveLength(2);
      expect(gameState?.status).toBe('active'); // Should activate with 2 players
      expect(gameState?.currentTurn).toBeDefined();
    });

    it('should reject invalid game IDs', async () => {
      const result = await gameManager.joinGame(mockSocket as Socket, {
        gameId: '',
        playerName: 'Test Player',
        role: 'player1'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid game ID');
    });

    it('should reject invalid player names', async () => {
      const result = await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: '',
        role: 'player1'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid player name');
    });

    it('should reject invalid roles', async () => {
      const result = await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Test Player',
        role: 'invalid' as any
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid player role');
    });

    it('should reject joining non-existent games', async () => {
      const result = await gameManager.joinGame(mockSocket as Socket, {
        gameId: 'NONEXISTENT',
        playerName: 'Test Player',
        role: 'player1'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not found');
    });

    it('should reject joining when role is already taken', async () => {
      // First player joins
      await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });

      // Second player tries to join with same role
      const mockSocket2 = createMockSocket('socket-2');
      const result = await gameManager.joinGame(mockSocket2 as Socket, {
        gameId,
        playerName: 'Player 1 Duplicate',
        role: 'player1'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Role already taken');
    });

    it('should allow reconnection when player disconnected', async () => {
      // Player joins initially
      await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });

      // Player leaves
      await gameManager.leaveGame(mockSocket as Socket);

      // Player reconnects with same role
      const mockSocket2 = createMockSocket('socket-2');
      const result = await gameManager.joinGame(mockSocket2 as Socket, {
        gameId,
        playerName: 'Player 1 Reconnected',
        role: 'player1'
      });

      expect(result.success).toBe(true);
      
      const gameState = gameManager.getGameState(gameId);
      expect(gameState?.players).toHaveLength(1);
      expect(gameState?.players[0].connected).toBe(true);
      expect(gameState?.players[0].name).toBe('Player 1 Reconnected');
    });

    it('should start game when minimum players reached', async () => {
      // Add player1
      await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });
      
      let gameState = gameManager.getGameState(gameId);
      expect(gameState?.status).toBe('waiting');

      // Add player2 (should start game)
      const mockSocket2 = createMockSocket('socket-2');
      await gameManager.joinGame(mockSocket2 as Socket, {
        gameId,
        playerName: 'Player 2',
        role: 'player2'
      });

      gameState = gameManager.getGameState(gameId);
      expect(gameState?.status).toBe('active');
      expect(gameState?.currentTurn).toBe(gameState?.players.find(p => p.role === 'player1')?.id);
    });
  });

  describe('leaveGame', () => {
    let gameId: string;

    beforeEach(async () => {
      gameId = gameManager.createGame();
      mockSocket.data = {
        playerId: 'player-1',
        gameId,
        playerName: 'Test Player',
        role: 'player1'
      };
      
      await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Test Player',
        role: 'player1'
      });
    });

    it('should mark player as disconnected', async () => {
      await gameManager.leaveGame(mockSocket as Socket);

      const gameState = gameManager.getGameState(gameId);
      expect(gameState?.players[0].connected).toBe(false);
      expect(mockSocket.leave).toHaveBeenCalledWith(gameId);
    });

    it('should handle leaving when player not in game', async () => {
      mockSocket.data = {};
      
      // Should not throw error
      await expect(gameManager.leaveGame(mockSocket as Socket)).resolves.toBeUndefined();
    });

    it('should handle leaving non-existent game', async () => {
      mockSocket.data = {
        playerId: 'player-1',
        gameId: 'NONEXISTENT',
        playerName: 'Test Player',
        role: 'player1'
      };
      
      // Should not throw error
      await expect(gameManager.leaveGame(mockSocket as Socket)).resolves.toBeUndefined();
    });
  });

  describe('getGameState', () => {
    it('should return game state for existing game', () => {
      const gameId = gameManager.createGame();
      const gameState = gameManager.getGameState(gameId);
      
      expect(gameState).toBeDefined();
      expect(gameState?.id).toBe(gameId);
    });

    it('should return undefined for non-existent game', () => {
      const gameState = gameManager.getGameState('NONEXISTENT');
      expect(gameState).toBeUndefined();
    });
  });

  describe('broadcastGameUpdate', () => {
    it('should emit game update to room', () => {
      const gameId = gameManager.createGame();
      gameManager.broadcastGameUpdate(gameId);

      expect(mockIO.to).toHaveBeenCalledWith(gameId);
      expect(mockIO.emit).toHaveBeenCalledWith('game:update', expect.any(Object));
    });

    it('should handle broadcasting to non-existent game', () => {
      gameManager.broadcastGameUpdate('NONEXISTENT');
      // Should not throw error
    });
  });

  describe('monitoring methods', () => {
    it('should return correct active games count', async () => {
      const gameId1 = gameManager.createGame();
      gameManager.createGame(); // Second game
      
      // No active games initially
      expect(gameManager.getActiveGamesCount()).toBe(0);
      
      // Add players to start games
      await gameManager.joinGame(mockSocket as Socket, {
        gameId: gameId1,
        playerName: 'Player 1',
        role: 'player1'
      });
      
      const mockSocket2 = createMockSocket('socket-2');
      await gameManager.joinGame(mockSocket2 as Socket, {
        gameId: gameId1,
        playerName: 'Player 2',
        role: 'player2'
      });
      
      expect(gameManager.getActiveGamesCount()).toBe(1);
    });

    it('should return correct total players count', async () => {
      const gameId = gameManager.createGame();
      
      expect(gameManager.getTotalPlayersCount()).toBe(0);
      
      await gameManager.joinGame(mockSocket as Socket, {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });
      
      expect(gameManager.getTotalPlayersCount()).toBe(1);
      
      const mockSocket2 = createMockSocket('socket-2');
      await gameManager.joinGame(mockSocket2 as Socket, {
        gameId,
        playerName: 'Player 2',
        role: 'player2'
      });
      
      expect(gameManager.getTotalPlayersCount()).toBe(2);
    });
  });
});