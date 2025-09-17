import { SocketHandlers } from '../sockets/socketHandlers';
import { GameManager } from '../game/GameManager';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';

// Mock socket implementation
const createMockSocket = (id: string = 'mock-socket-id'): Partial<Socket> => ({
  id,
  data: {},
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
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

describe('SocketHandlers', () => {
  let socketHandlers: SocketHandlers;
  let mockIO: Partial<SocketIOServer>;
  let mockGameManager: jest.Mocked<GameManager>;
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    mockIO = createMockIO();
    mockGameManager = {
      createGame: jest.fn(),
      joinGame: jest.fn(),
      leaveGame: jest.fn(),
      getGameState: jest.fn(),
      broadcastGameUpdate: jest.fn(),
      getActiveGamesCount: jest.fn(),
      getTotalPlayersCount: jest.fn(),
    } as any;
    
    socketHandlers = new SocketHandlers(mockIO as SocketIOServer, mockGameManager);
    mockSocket = createMockSocket();
  });

  describe('handleConnection', () => {
    it('should set up event listeners on connection', () => {
      socketHandlers.handleConnection(mockSocket as Socket);

      expect(mockSocket.on).toHaveBeenCalledWith('player:joined', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('player:left', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('action:performed', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('turn:ended', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('handlePlayerJoined', () => {
    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket as Socket);
    });

    it('should handle successful player join', async () => {
      const joinData = {
        gameId: 'GAME123',
        playerName: 'Test Player',
        role: 'player1' as const
      };

      mockGameManager.joinGame.mockResolvedValue({ success: true });

      // Get the handler function that was registered
      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const playerJoinedHandler = onCalls.find(call => call[0] === 'player:joined')?.[1];
      
      await playerJoinedHandler?.(joinData);

      expect(mockGameManager.joinGame).toHaveBeenCalledWith(mockSocket, joinData);
    });

    it('should handle failed player join', async () => {
      const joinData = {
        gameId: 'GAME123',
        playerName: 'Test Player',
        role: 'player1' as const
      };

      mockGameManager.joinGame.mockResolvedValue({ 
        success: false, 
        message: 'Game not found' 
      });

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const playerJoinedHandler = onCalls.find(call => call[0] === 'player:joined')?.[1];
      
      await playerJoinedHandler?.(joinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error:connection', 'Game not found');
    });

    it('should handle join errors gracefully', async () => {
      const joinData = {
        gameId: 'GAME123',
        playerName: 'Test Player',
        role: 'player1' as const
      };

      mockGameManager.joinGame.mockRejectedValue(new Error('Database error'));

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const playerJoinedHandler = onCalls.find(call => call[0] === 'player:joined')?.[1];
      
      await playerJoinedHandler?.(joinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error:connection', 'Internal server error');
    });
  });

  describe('handlePlayerLeft', () => {
    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket as Socket);
    });

    it('should call game manager leave game', async () => {
      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const playerLeftHandler = onCalls.find(call => call[0] === 'player:left')?.[1];
      
      await playerLeftHandler?.();

      expect(mockGameManager.leaveGame).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle leave errors gracefully', async () => {
      mockGameManager.leaveGame.mockRejectedValue(new Error('Leave error'));

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const playerLeftHandler = onCalls.find(call => call[0] === 'player:left')?.[1];
      
      await playerLeftHandler?.();

      // Should not throw - error should be handled internally
      expect(mockGameManager.leaveGame).toHaveBeenCalledWith(mockSocket);
    });
  });

  describe('handleActionPerformed', () => {
    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket as Socket);
      mockSocket.data = {
        gameId: 'GAME123',
        playerId: 'player-1'
      };
    });

    it('should broadcast action to game room', () => {
      const mockGameState = {
        id: 'GAME123',
        players: [{ id: 'player-1', role: 'player1' }],
        currentTurn: 'player-1',
        status: 'active'
      };

      mockGameManager.getGameState.mockReturnValue(mockGameState as any);

      const actionData = {
        type: 'demo',
        payload: { message: 'test action' }
      };

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const actionHandler = onCalls.find(call => call[0] === 'action:performed')?.[1];
      
      actionHandler?.(actionData);

      expect(mockGameManager.broadcastGameUpdate).toHaveBeenCalledWith('GAME123');
    });

    it('should handle actions when player not in game', () => {
      mockSocket.data = {};
      
      const actionData = {
        type: 'demo',
        payload: { message: 'test action' }
      };

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const actionHandler = onCalls.find(call => call[0] === 'action:performed')?.[1];
      
      actionHandler?.(actionData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error:invalid-action', 'Not in a game');
    });
  });

  describe('handleTurnEnded', () => {
    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket as Socket);
      mockSocket.data = {
        gameId: 'GAME123',
        playerId: 'player-1'
      };
    });

    it('should handle turn end and broadcast update', () => {
      const mockGameState = {
        id: 'GAME123',
        players: [
          { id: 'player-1', role: 'player1' },
          { id: 'player-2', role: 'player2' }
        ],
        currentTurn: 'player-1',
        status: 'active'
      };

      mockGameManager.getGameState.mockReturnValue(mockGameState as any);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const turnEndHandler = onCalls.find(call => call[0] === 'turn:ended')?.[1];
      
      turnEndHandler?.();

      expect(mockGameManager.broadcastGameUpdate).toHaveBeenCalledWith('GAME123');
    });

    it('should handle turn end when not player turn', () => {
      const mockGameState = {
        id: 'GAME123',
        players: [
          { id: 'player-1', role: 'player1' },
          { id: 'player-2', role: 'player2' }
        ],
        currentTurn: 'player-2', // Not current player's turn
        status: 'active'
      };

      mockGameManager.getGameState.mockReturnValue(mockGameState as any);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const turnEndHandler = onCalls.find(call => call[0] === 'turn:ended')?.[1];
      
      turnEndHandler?.();

      expect(mockSocket.emit).toHaveBeenCalledWith('error:invalid-action', 'Cannot end turn');
    });

    it('should handle turn end when not in game', () => {
      mockSocket.data = {};

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const turnEndHandler = onCalls.find(call => call[0] === 'turn:ended')?.[1];
      
      turnEndHandler?.();

      expect(mockSocket.emit).toHaveBeenCalledWith('error:invalid-action', 'Not in a game');
    });
  });

  describe('handleDisconnect', () => {
    beforeEach(() => {
      socketHandlers.handleConnection(mockSocket as Socket);
    });

    it('should call leave game on disconnect', async () => {
      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const disconnectHandler = onCalls.find(call => call[0] === 'disconnect')?.[1];
      
      await disconnectHandler?.();

      expect(mockGameManager.leaveGame).toHaveBeenCalledWith(mockSocket);
    });
  });
});