import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
  Player,
  logger
} from '@tcgconnect/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  gameId?: string;
  playerName?: string;
  role?: 'host' | 'player1' | 'player2';
  autoConnect?: boolean;
}

interface SocketState {
  connected: boolean;
  gameState: GameState | null;
  error: string | null;
  players: Player[];
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { gameId, playerName, role, autoConnect = false } = options;
  const socketRef = useRef<TypedSocket | null>(null);
  
  const [state, setState] = useState<SocketState>({
    connected: false,
    gameState: null,
    error: null,
    players: []
  });

  const connect = () => {
    if (socketRef.current?.connected) return;

    const socket: TypedSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: false
    });

    // Connection events
    socket.on('connect', () => {
      logger.info('Connected to server');
      setState(prev => ({ ...prev, connected: true, error: null }));
      
      // Auto-join game if parameters provided
      if (gameId && playerName && role) {
        joinGame(gameId, playerName, role);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Disconnected from server', { reason });
      setState(prev => ({ 
        ...prev, 
        connected: false,
        error: `Disconnected: ${reason}`
      }));
    });

    socket.on('connect_error', (error) => {
      logger.error('Connection error', { error: error.message });
      setState(prev => ({ 
        ...prev, 
        connected: false,
        error: `Connection failed: ${error.message}`
      }));
    });

    // Game events
    socket.on('game:update', (gameState: GameState) => {
      logger.debug('Game state updated', { gameId: gameState.id, status: gameState.status });
      setState(prev => ({
        ...prev,
        gameState,
        players: gameState.players,
        error: null
      }));
    });

    socket.on('game:created', (createdGameId: string) => {
      logger.info('Game created', { gameId: createdGameId });
    });

    socket.on('player:connected', (player: Player) => {
      logger.debug('Player connected', { playerId: player.id, name: player.name });
    });

    socket.on('player:disconnected', (playerId: string) => {
      logger.debug('Player disconnected', { playerId });
    });

    // Error events
    socket.on('error:connection', (message: string) => {
      logger.error('Connection error', { message });
      setState(prev => ({ ...prev, error: message }));
    });

    socket.on('error:invalid-action', (message: string) => {
      logger.warn('Invalid action', { message });
      setState(prev => ({ ...prev, error: message }));
    });

    socketRef.current = socket;
    socket.connect();
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const joinGame = (gameId: string, playerName: string, role: 'host' | 'player1' | 'player2') => {
    if (!socketRef.current?.connected) {
      setState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    socketRef.current.emit('player:joined', { gameId, playerName, role });
  };

  const leaveGame = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('player:left');
  };

  const performAction = (type: string, payload: any) => {
    if (!socketRef.current?.connected) {
      setState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    socketRef.current.emit('action:performed', { type, payload });
  };

  const endTurn = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('turn:ended');
  };

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    ...state,
    socket: socketRef.current,
    connect,
    disconnect,
    joinGame,
    leaveGame,
    performAction,
    endTurn,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
};