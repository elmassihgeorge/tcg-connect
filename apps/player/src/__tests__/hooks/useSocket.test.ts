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

describe('useSocket Hook (Player)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSocket({
      gameId: undefined,
      playerName: undefined,
      role: undefined,
      autoConnect: false
    }));

    expect(result.current.connected).toBe(false);
    expect(result.current.players).toEqual([]);
    expect(result.current.gameState).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should provide endTurn function', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Player',
      role: 'player1',
      autoConnect: false
    }));

    act(() => {
      result.current.endTurn();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('turn:ended');
  });

  it('should connect for player role', () => {
    renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Player',
      role: 'player1',
      autoConnect: true
    }));

    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('should handle player2 role', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Player',
      role: 'player2',
      autoConnect: false
    }));

    act(() => {
      result.current.joinGame('GAME123', 'Test Player', 'player2');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('player:joined', {
      gameId: 'GAME123',
      playerName: 'Test Player',
      role: 'player2'
    });
  });

  it('should handle player disconnection events', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Player',
      role: 'player1',
      autoConnect: false
    }));

    // Add a player first
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

    // Now disconnect the player
    act(() => {
      const onCalls = mockSocket.on.mock.calls;
      const playerDisconnectedHandler = onCalls.find(call => call[0] === 'player:disconnected')?.[1];
      playerDisconnectedHandler?.('player-1');
    });

    // Player should be marked as disconnected
    const disconnectedPlayer = result.current.players.find(p => p.id === 'player-1');
    expect(disconnectedPlayer?.connected).toBe(false);
  });

  it('should handle error events', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Player',
      role: 'player1',
      autoConnect: false
    }));

    act(() => {
      const onCalls = mockSocket.on.mock.calls;
      const errorHandler = onCalls.find(call => call[0] === 'error:invalid-action')?.[1];
      errorHandler?.('Invalid action error');
    });

    expect(result.current.error).toBe('Invalid action error');
  });

  it('should update state when reconnecting after disconnect', () => {
    const { result } = renderHook(() => useSocket({
      gameId: 'GAME123',
      playerName: 'Test Player',
      role: 'player1',
      autoConnect: false
    }));

    // Simulate initial connection
    act(() => {
      mockSocket.connected = true;
      const onCalls = mockSocket.on.mock.calls;
      const connectHandler = onCalls.find(call => call[0] === 'connect')?.[1];
      connectHandler?.();
    });

    expect(result.current.connected).toBe(true);

    // Simulate disconnect
    act(() => {
      mockSocket.connected = false;
      const onCalls = mockSocket.on.mock.calls;
      const disconnectHandler = onCalls.find(call => call[0] === 'disconnect')?.[1];
      disconnectHandler?.();
    });

    expect(result.current.connected).toBe(false);

    // Simulate reconnect
    act(() => {
      mockSocket.connected = true;
      const onCalls = mockSocket.on.mock.calls;
      const connectHandler = onCalls.find(call => call[0] === 'connect')?.[1];
      connectHandler?.();
    });

    expect(result.current.connected).toBe(true);
  });
});