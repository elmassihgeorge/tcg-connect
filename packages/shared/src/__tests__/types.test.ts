import { GameState, Player } from '../types/game';

describe('Shared Types', () => {
  describe('Player', () => {
    it('should create a valid player object', () => {
      const player: Player = {
        id: 'player1',
        name: 'Test Player',
        role: 'player1',
        connected: true,
        joinedAt: new Date(),
      };

      expect(player.id).toBe('player1');
      expect(player.name).toBe('Test Player');
      expect(player.role).toBe('player1');
      expect(player.connected).toBe(true);
    });

    it('should accept all valid player roles', () => {
      const roles: Player['role'][] = ['host', 'player1', 'player2'];
      
      roles.forEach(role => {
        const player: Player = {
          id: 'test',
          name: 'Test',
          role,
          connected: false,
          joinedAt: new Date(),
        };
        expect(player.role).toBe(role);
      });
    });
  });

  describe('GameState', () => {
    it('should create a valid game state object', () => {
      const gameState: GameState = {
        id: 'game123',
        players: [],
        currentTurn: 'player1',
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(gameState.id).toBe('game123');
      expect(gameState.players).toEqual([]);
      expect(gameState.currentTurn).toBe('player1');
      expect(gameState.status).toBe('waiting');
    });

    it('should accept all valid game statuses', () => {
      const statuses: GameState['status'][] = ['waiting', 'active', 'finished'];
      
      statuses.forEach(status => {
        const gameState: GameState = {
          id: 'test',
          players: [],
          currentTurn: 'player1',
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(gameState.status).toBe(status);
      });
    });
  });
});