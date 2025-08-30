// Utility functions

// Generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Validate game ID format
export const isValidGameId = (gameId: string): boolean => {
  return typeof gameId === 'string' && gameId.length > 0 && gameId.length <= 50;
};

// Validate player name
export const isValidPlayerName = (name: string): boolean => {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 30;
};

// Safe JSON parsing
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

// Create standardized error messages
export const createErrorMessage = (type: string, message: string) => ({
  type,
  message,
  timestamp: new Date().toISOString(),
});

// Re-export logger
export { logger, LogLevel } from './logger';