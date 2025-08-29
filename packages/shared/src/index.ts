// Game State Types
export interface GameState {
  id: string;
  players: Player[];
  currentTurn: string;
  status: 'waiting' | 'active' | 'finished';
}

export interface Player {
  id: string;
  name: string;
  role: 'host' | 'player1' | 'player2';
  connected: boolean;
}

// Socket Event Types
export interface SocketEvents {
  // Connection events
  'join-game': (data: { gameId: string; playerName: string; role: string }) => void;
  'leave-game': () => void;
  
  // Game state events
  'game-state-update': (state: GameState) => void;
  'player-joined': (player: Player) => void;
  'player-left': (playerId: string) => void;
}

// Utility types for socket communication
export type SocketEventMap = {
  [K in keyof SocketEvents]: SocketEvents[K];
};