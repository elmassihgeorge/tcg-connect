import {
  generateId,
  isValidGameId,
  isValidPlayerName,
  safeJsonParse,
  createErrorMessage
} from '../utils';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('isValidGameId', () => {
    it('should return true for valid game IDs', () => {
      expect(isValidGameId('abc123')).toBe(true);
      expect(isValidGameId('game-123')).toBe(true);
      expect(isValidGameId('a')).toBe(true);
    });

    it('should return false for invalid game IDs', () => {
      expect(isValidGameId('')).toBe(false);
      expect(isValidGameId('a'.repeat(51))).toBe(false);
    });
  });

  describe('isValidPlayerName', () => {
    it('should return true for valid player names', () => {
      expect(isValidPlayerName('John')).toBe(true);
      expect(isValidPlayerName('Player 1')).toBe(true);
      expect(isValidPlayerName('   Alice   ')).toBe(true); // Trimmed
    });

    it('should return false for invalid player names', () => {
      expect(isValidPlayerName('')).toBe(false);
      expect(isValidPlayerName('   ')).toBe(false);
      expect(isValidPlayerName('a'.repeat(31))).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"test": true}', {});
      expect(result).toEqual({ test: true });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { error: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('createErrorMessage', () => {
    it('should create error message with timestamp', () => {
      const error = createErrorMessage('test', 'Test message');
      
      expect(error.type).toBe('test');
      expect(error.message).toBe('Test message');
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp)).toBeInstanceOf(Date);
    });
  });
});