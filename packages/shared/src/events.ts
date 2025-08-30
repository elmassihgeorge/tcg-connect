// Socket Event Definitions
// Following the naming convention from CLAUDE.md:
// - Player-initiated events (past tense)
// - Server-initiated events (present tense)

import { GameState, Player } from './types/game';

// Player-initiated events (what players send to server)
export interface ClientToServerEvents {
  // Connection events
  'player:joined': (data: { gameId: string; playerName: string; role: 'host' | 'player1' | 'player2' }) => void;
  'player:left': () => void;
  
  // Game events
  'action:performed': (data: { type: string; payload: unknown }) => void;
  'turn:ended': () => void;
}

// Server-initiated events (what server sends to clients)
export interface ServerToClientEvents {
  // Game state updates
  'game:update': (state: GameState) => void;
  'game:created': (gameId: string) => void;
  'game:ended': (reason: string) => void;
  
  // Player updates
  'player:connected': (player: Player) => void;
  'player:disconnected': (playerId: string) => void;
  
  // Error handling
  'error:invalid-action': (message: string) => void;
  'error:connection': (message: string) => void;
}

// Inter-server events (for future scaling)
export interface InterServerEvents {
  'server:broadcast': (message: string) => void;
}

// Socket data (attached to each socket)
export interface SocketData {
  playerId?: string;
  gameId?: string;
  playerName?: string;
  role?: 'host' | 'player1' | 'player2';
}

// Event validation helpers
export const isValidPlayerRole = (role: string): role is 'host' | 'player1' | 'player2' => {
  return ['host', 'player1', 'player2'].includes(role);
};

export const isValidGameStatus = (status: string): status is 'waiting' | 'active' | 'finished' => {
  return ['waiting', 'active', 'finished'].includes(status);
};