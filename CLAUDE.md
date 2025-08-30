# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Multi-Device TCG Simulator**: A hybrid physical/digital trading card game platform that enables multiplayer gameplay across multiple devices. Players use their phones for private interactions while a central display shows the public game state.

### Core Concept
- Multiple players connect via their mobile devices to a shared game session
- Central host display (TV/laptop) shows the game board and public information
- Each player's phone shows their private information and available actions
- Real-time synchronization across all connected devices

## Quick Start

### Docker Development (Recommended)
```bash
# First-time setup
cp .env.example .env
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after major changes
docker-compose up -d --build
```

### Native Development
```bash
# First-time setup
npm install
npm run install:all

# Development (all services)
npm run dev

# Development (individual services)
npm run dev:server    # Backend on http://localhost:3001
npm run dev:host      # Host display on http://localhost:5173
npm run dev:player    # Player app on http://localhost:5174

# Building for production
npm run build:shared  # Always build shared first!
npm run build         # Then build all apps
```

## Project Structure

```
├── apps/
│   ├── server/          # Node.js backend
│   │   ├── src/
│   │   │   ├── index.ts         # Server entry point
│   │   │   ├── game/            # Game logic
│   │   │   ├── sockets/         # Socket.io event handlers
│   │   │   └── types/           # Server-specific types
│   │   └── package.json
│   │
│   ├── host/            # React host display app
│   │   ├── src/
│   │   │   ├── components/      # UI components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── socket/          # Socket client logic
│   │   │   └── App.tsx          # Main app component
│   │   └── package.json
│   │
│   └── player/          # React mobile player app
│       ├── src/
│       │   ├── components/      # Mobile-optimized components
│       │   ├── hooks/           # Player-specific hooks
│       │   ├── socket/          # Player socket logic
│       │   └── App.tsx
│       └── package.json
│
├── packages/
│   └── shared/          # Shared code between all apps
│       ├── src/
│       │   ├── index.ts         # Exported types and constants
│       │   ├── events.ts        # Socket event definitions
│       │   ├── types/           # Shared type definitions
│       │   └── utils/           # Shared utilities
│       └── package.json
│
└── package.json         # Root workspace configuration
```

## Architecture & Data Flow

```
Player Device 1 ←→ |
Player Device 2 ←→ | Socket.io → Server → Socket.io → Host Display
Player Device N ←→ |                ↓
                              Game State
```

### Communication Patterns

1. **Player Actions**: Player App → Server (validation) → Broadcast to Host + All Players
2. **Game Updates**: Server → Broadcast to all connected clients
3. **Private Data**: Server → Targeted emit to specific player
4. **Public Data**: Server → Broadcast to host and all players

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io + TypeScript
- **Real-time Communication**: Socket.io WebSockets
- **Build System**: Monorepo with npm workspaces

### Key Design Patterns
- Separation of public vs private game state
- Socket.io event-driven architecture for multi-device sync
- Shared TypeScript types between client and server
- Mobile-first design for player interface
- Large-screen optimized host interface
- Server as single source of truth for game state

## Development Workflow

### Adding New Features

1. Define types in `packages/shared/src/types/`
2. Add Socket event definitions in `packages/shared/src/events.ts`
3. Implement server-side logic in `apps/server/src/`
4. Create UI components in respective apps
5. Test with multiple connected clients

### Socket Event Naming Convention
```typescript
// Player-initiated events (past tense)
'player:joined'
'action:performed'
'turn:ended'

// Server-initiated events (present tense)
'game:update'
'player:disconnect'
'error:invalid-action'
```

### Debugging Socket Connections

```typescript
// Enable Socket.io debug mode in browser console
localStorage.debug = 'socket.io-client:*';

// Server-side debugging
DEBUG=socket.io:* npm run dev:server
```

## State Management Philosophy

- **Server State**: Authoritative source of truth for all game data
- **Client State**: Derived views of server state
- **Optimistic Updates**: UI updates immediately, server validates
- **Conflict Resolution**: Server rejection reverts client state

## Code Style & Conventions

- **TypeScript**: Strict mode enabled, prefer interfaces over types
- **React**: Functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components/types
- **Imports**: Absolute imports from `@/` for app code
- **Error Handling**: Always validate on server, optimistic UI on client

## Common Development Patterns

### Multi-Device Synchronization
- All state changes flow through the server
- Clients never directly communicate with each other
- Use Socket.io rooms for game session management

### Responsive Design Requirements
- Host app: Optimized for large screens (1080p+)
- Player app: Mobile-first, touch-optimized
- Both apps should handle orientation changes gracefully

## Common Pitfalls & Solutions

1. **Shared package not building**: Always run `npm run build:shared` first
2. **Socket connection issues**: Check CORS settings in server
3. **Type mismatches**: Ensure shared package is rebuilt after type changes
4. **Mobile responsiveness**: Test player app with Chrome DevTools mobile view
5. **Race conditions**: Server validates all actions sequentially

## Testing Strategy

```bash
# Unit tests
npm run test:shared
npm run test:server

# Manual testing with multiple clients
# Open multiple browser tabs/devices to simulate players
```

## Performance Considerations

- Host app may render many elements - use React.memo where appropriate
- Player apps on mobile - minimize re-renders, optimize for battery life
- Socket events - batch related updates when possible
- Asset loading - implement lazy loading for images/resources

## Environment Variables

```bash
# Development defaults are set, but can be overridden:
SERVER_PORT=3001
CLIENT_URL=http://localhost:5173
SOCKET_IO_CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# Production requires explicit configuration
```

## Docker Development

The project includes comprehensive Docker support for streamlined development:

### Development Workflow with Docker
1. **Start Services**: `docker-compose up -d` starts all services in the background
2. **Live Reload**: Code changes are automatically reflected in running containers
3. **Debugging**: Access logs with `docker-compose logs -f [service]`
4. **Testing**: Run tests with `docker-compose exec server npm test`
5. **Clean Up**: Use `docker-compose down -v` to reset everything

### Docker Services
- **server**: Node.js backend with Socket.io (port 3001)
- **host**: React host display app (port 5173)
- **player**: React mobile player app (port 5174)

### Volume Mounting
- Source code is mounted for live editing
- Node modules are cached in Docker volumes for performance
- Build artifacts are preserved between container restarts

### Production Deployment
- Multi-stage builds for optimized production images
- Nginx serves static assets with proper caching headers
- Health checks monitor service availability
- Security headers configured for production

## When Making Changes

1. **Think multiplayer-first**: Every action affects multiple clients
2. **Validate on server**: Never trust client input
3. **Consider mobile**: Player app must work on small screens
4. **Maintain type safety**: Update shared types for any data structure changes
5. **Test with multiple clients**: Simulate real multiplayer scenarios
6. **Handle disconnections**: Players may disconnect/reconnect mid-game
7. **Use production logging**: Leverage the structured logging system instead of console.log

## Logging

The project uses a centralized logging system:
```typescript
import { logger } from '@tcgconnect/shared';

logger.info('User action', { userId, action });
logger.error('Connection failed', { error: error.message });
logger.debug('Game state update', { gameId, state });
```

## Project Status

This is an active development project building the foundation for a TCG simulator. The architecture is designed to be game-agnostic, allowing for different rule sets and game types to be implemented on top of the core multi-device synchronization platform.

## Useful Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Performance](https://react.dev/reference/react/memo)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)