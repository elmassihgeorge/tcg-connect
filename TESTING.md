# Testing Infrastructure

This document outlines the comprehensive testing infrastructure for TCGConnect.

## Overview

The project uses a multi-layered testing approach:

1. **Unit Tests** - Individual component/function testing
2. **Integration Tests** - Socket.io and cross-component testing  
3. **Component Tests** - React component testing with user interactions
4. **End-to-End Tests** - Full Docker stack testing
5. **Coverage Reporting** - Comprehensive coverage analysis

## Test Frameworks

### Backend Testing (Jest)
- **Packages**: `packages/shared`, `apps/server`
- **Framework**: Jest with TypeScript support
- **Coverage**: 75-85% thresholds

### Frontend Testing (Vitest)
- **Packages**: `apps/host`, `apps/player`
- **Framework**: Vitest + React Testing Library
- **Coverage**: 70% thresholds

### E2E Testing (Jest + Docker)
- **Location**: `tests/e2e/`
- **Framework**: Jest with Docker Compose
- **Scope**: Full application stack

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Open coverage report in browser
npm run test:coverage:open

# Run tests in watch mode
npm run test:watch

# Run individual package tests
npm run test:shared
npm run test:server
npm run test:host
npm run test:player

# Run E2E tests
npm run test:e2e:install  # First time only
npm run test:e2e
```

### Docker Testing

```bash
# Test with Docker (same as E2E)
docker-compose up --build
npm run test:e2e
docker-compose down
```

## Test Structure

### Unit Tests
```
packages/shared/src/__tests__/
├── events.test.ts
├── types.test.ts
└── utils.test.ts

apps/server/src/__tests__/
├── setup.ts
├── server.test.ts
├── GameManager.test.ts
├── socketHandlers.test.ts
└── integration/
    └── socket-integration.test.ts
```

### Component Tests
```
apps/host/src/__tests__/
├── App.test.tsx
└── hooks/
    └── useSocket.test.ts

apps/player/src/__tests__/
├── App.test.tsx
└── hooks/
    └── useSocket.test.ts
```

### E2E Tests
```
tests/e2e/
├── package.json
└── docker-e2e.test.js
```

## Coverage Configuration

### Coverage Thresholds

| Package | Lines | Functions | Branches | Statements |
|---------|-------|-----------|----------|------------|
| Shared | 85% | 85% | 85% | 85% |
| Server (Global) | 75% | 75% | 75% | 75% |
| Server (Game Logic) | 85% | 85% | 85% | 85% |
| Host App | 70% | 70% | 70% | 70% |
| Player App | 70% | 70% | 70% | 70% |

### Coverage Reports

After running `npm run test:coverage`, reports are available at:
- `coverage/combined/index.html` - Combined report dashboard
- `coverage/combined/packages-shared/` - Shared package coverage
- `coverage/combined/apps-server/` - Server coverage
- `coverage/combined/apps-host/` - Host app coverage  
- `coverage/combined/apps-player/` - Player app coverage

## CI/CD Integration

### GitHub Actions Pipeline

The CI pipeline runs:

1. **Lint & Type Check** - Parallel ESLint and TypeScript checking
2. **Test Suite** - All unit and integration tests with coverage
3. **Build Validation** - Ensure all packages build successfully
4. **Security Audit** - npm audit for vulnerabilities
5. **Docker Build Test** - Validate Docker containers build and run
6. **E2E Tests** - Full stack integration testing

### Coverage Upload

Coverage reports are automatically uploaded to Codecov on successful test runs.

## Test Utilities & Mocks

### Socket.io Mocking
```typescript
// Frontend tests use mocked socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}));
```

### React Testing Setup
```typescript
// Vitest setup includes:
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocks for window.matchMedia, ResizeObserver, etc.
```

### Backend Test Utilities
```typescript
// Jest setup for Socket.io integration testing
// Mock implementations for GameManager testing
```

## Best Practices

### Writing Tests

1. **Test Behavior, Not Implementation** - Focus on what the code does, not how
2. **Use Descriptive Test Names** - `should handle player disconnection gracefully`
3. **Arrange-Act-Assert Pattern** - Clear test structure
4. **Mock External Dependencies** - Isolate units under test
5. **Test Edge Cases** - Error conditions, invalid inputs, boundary conditions

### Test Organization

1. **Group Related Tests** - Use `describe` blocks effectively
2. **Use Setup/Teardown** - `beforeEach`/`afterEach` for clean state
3. **Avoid Test Interdependence** - Each test should run independently
4. **Keep Tests Fast** - Unit tests should run in milliseconds

### Coverage Goals

1. **Prioritize Critical Paths** - Game logic should have higher coverage
2. **Don't Chase 100%** - Focus on meaningful coverage
3. **Test Public APIs** - Internal implementation can change
4. **Include Error Handling** - Test failure scenarios

## Debugging Tests

### Local Debugging

```bash
# Run specific test file
npm run test:server -- GameManager.test.ts

# Run tests in debug mode
npm run test:server -- --inspect-brk

# Run with verbose output
npm run test -- --verbose
```

### CI Debugging

Check GitHub Actions logs for:
- Test failures with stack traces
- Coverage threshold failures
- Build/deployment issues

## Future Enhancements

1. **Visual Regression Testing** - Screenshot comparison for UI
2. **Performance Testing** - Load testing for Socket.io connections
3. **Cross-browser Testing** - Automated browser compatibility
4. **Mobile Testing** - Touch interaction testing
5. **Accessibility Testing** - Automated a11y checks

## Troubleshooting

### Common Issues

1. **Test Timeouts** - Increase timeout for async operations
2. **Socket.io Connection Issues** - Ensure proper cleanup in tests
3. **Coverage Threshold Failures** - Check uncovered lines/branches
4. **Docker Issues** - Verify port availability and container health

### Getting Help

- Check test logs for specific error messages
- Review coverage reports to identify untested code
- Consult framework documentation (Jest/Vitest)
- Check GitHub Actions workflow for CI failures