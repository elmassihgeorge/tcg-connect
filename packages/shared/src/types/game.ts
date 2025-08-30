// Core game state types

export interface Player {
  id: string;
  name: string;
  role: 'host' | 'player1' | 'player2';
  connected: boolean;
  joinedAt: Date;
}

export interface GameState {
  id: string;
  players: Player[];
  currentTurn: string; // Player ID whose turn it is
  status: 'waiting' | 'active' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

// Game action types (for future expansion)
export interface GameAction {
  id: string;
  playerId: string;
  type: string;
  payload: any;
  timestamp: Date;
}

// Room information for Socket.io
export interface GameRoom {
  id: string;
  hostSocketId?: string;
  playerSocketIds: Map<string, string>; // playerId -> socketId
  maxPlayers: number;
}

// Game configuration
export interface GameConfig {
  maxPlayers: number;
  turnTimeLimit?: number; // seconds
  allowReconnection: boolean;
}