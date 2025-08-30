import { isValidPlayerRole, isValidGameStatus } from '../events';

describe('Event Validation', () => {
  describe('isValidPlayerRole', () => {
    it('should return true for valid player roles', () => {
      expect(isValidPlayerRole('host')).toBe(true);
      expect(isValidPlayerRole('player1')).toBe(true);
      expect(isValidPlayerRole('player2')).toBe(true);
    });

    it('should return false for invalid player roles', () => {
      expect(isValidPlayerRole('invalid')).toBe(false);
      expect(isValidPlayerRole('player3')).toBe(false);
      expect(isValidPlayerRole('')).toBe(false);
      expect(isValidPlayerRole('HOST')).toBe(false);
    });
  });

  describe('isValidGameStatus', () => {
    it('should return true for valid game statuses', () => {
      expect(isValidGameStatus('waiting')).toBe(true);
      expect(isValidGameStatus('active')).toBe(true);
      expect(isValidGameStatus('finished')).toBe(true);
    });

    it('should return false for invalid game statuses', () => {
      expect(isValidGameStatus('invalid')).toBe(false);
      expect(isValidGameStatus('paused')).toBe(false);
      expect(isValidGameStatus('')).toBe(false);
      expect(isValidGameStatus('ACTIVE')).toBe(false);
    });
  });
});