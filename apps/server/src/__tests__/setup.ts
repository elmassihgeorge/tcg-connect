// Test setup file for server tests
// This file runs before each test file

// Mock console methods to reduce noise during testing
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Mock console.log to reduce noise unless explicitly needed
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  
  // Clear all mocks
  jest.clearAllMocks();
});