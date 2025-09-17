import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from '../../hooks/useSocket';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
  id: 'mock-socket-id'
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}));

describe('useSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSocket({
      gameId: undefined,
      playerName: undefined,
      role: 'host',
      autoConnect: false
    }));

    expect(result.current.connected).toBe(false);
    expect(result.current.players).toEqual([]);
    expect(result.current.gameState).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should connect when autoConnect is true', () => {
    renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: true
    }));

    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('should not connect when autoConnect is false', () => {
    renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('should set up event listeners on connect', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: true
    }));

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game:update', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player:connected', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('player:disconnected', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('error:connection', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('error:invalid-action', expect.any(Function));
  });

  it('should provide connect function', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    act(() => {
      result.current.connect();
    });

    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('should provide disconnect function', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    act(() => {
      result.current.disconnect();
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should provide joinGame function', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    act(() => {
      result.current.joinGame('GAME123', 'Test Host', 'host');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('player:joined', {
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host'
    });
  });

  it('should provide leaveGame function', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    act(() => {
      result.current.leaveGame();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('player:left');
  });

  it('should provide performAction function', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    act(() => {
      result.current.performAction('demo', { message: 'test' });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('action:performed', {
      type: 'demo',
      payload: { message: 'test' }
    });
  });

  it('should provide clearError function', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    // Set an error first
    act(() => {
      const onCalls = mockSocket.on.mock.calls;
      const errorHandler = onCalls.find(call => call[0] === 'error:connection')?.[1];
      errorHandler?.('Test error');
    });

    expect(result.current.error).toBe('Test error');

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should update connected state on connect/disconnect events', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    // Simulate connect event
    act(() => {
      mockSocket.connected = true;
      const onCalls = mockSocket.on.mock.calls;
      const connectHandler = onCalls.find(call => call[0] === 'connect')?.[1];
      connectHandler?.();
    });

    expect(result.current.connected).toBe(true);

    // Simulate disconnect event
    act(() => {
      mockSocket.connected = false;
      const onCalls = mockSocket.on.mock.calls;
      const disconnectHandler = onCalls.find(call => call[0] === 'disconnect')?.[1];
      disconnectHandler?.();
    });

    expect(result.current.connected).toBe(false);
  });

  it('should update game state on game:update events', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    const mockGameState = {
      id: 'GAME123',
      players: [],
      currentTurn: '',
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    act(() => {
      const onCalls = mockSocket.on.mock.calls;
      const gameUpdateHandler = onCalls.find(call => call[0] === 'game:update')?.[1];
      gameUpdateHandler?.(mockGameState);
    });

    expect(result.current.gameState).toEqual(mockGameState);
  });

  it('should update players on player:connected events', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    const mockPlayer = {
      id: 'player-1',
      name: 'Test Player',
      role: 'player1' as const,
      connected: true,
      joinedAt: new Date()
    };

    act(() => {
      const onCalls = mockSocket.on.mock.calls;
      const playerConnectedHandler = onCalls.find(call => call[0] === 'player:connected')?.[1];
      playerConnectedHandler?.(mockPlayer);
    });

    expect(result.current.players).toContainEqual(mockPlayer);
  });

  it('should handle cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Host',
      role: 'host',
      autoConnect: false
    }));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledWith('game:update');
    expect(mockSocket.off).toHaveBeenCalledWith('player:connected');
    expect(mockSocket.off).toHaveBeenCalledWith('player:disconnected');
    expect(mockSocket.off).toHaveBeenCalledWith('error:connection');
    expect(mockSocket.off).toHaveBeenCalledWith('error:invalid-action');
  });
});