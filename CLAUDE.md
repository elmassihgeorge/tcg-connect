# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Start all services in development mode
npm run dev

# Start individual services
npm run dev:server    # Backend server on port 3001
npm run dev:host      # Host display app on port 5173  
npm run dev:player    # Player mobile app on port 5174

# Build all applications
npm run build

# Build individual applications
npm run build:shared  # Build shared types first
npm run build:server  # Build backend
npm run build:host    # Build host app
npm run build:player  # Build player app
```

## Project Architecture

**Multi-Device TCG Simulator**: A hybrid physical/digital Pokemon TCG experience where:
- **Host App** (`apps/host`): Central display (laptop/TV) showing public game state
- **Player App** (`apps/player`): Mobile interface for private hand management
- **Server** (`apps/server`): Node.js backend with Socket.io for real-time synchronization
- **Shared Package** (`packages/shared`): Common TypeScript types and utilities

**Data Flow**:
- Player phones connect to server via Socket.io
- Server manages game state and validates moves
- Host display shows public information (board, scores, turn indicator)
- Player apps show private information (hand cards, deck status)

**Technology Stack**:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io + TypeScript
- **Real-time Communication**: Socket.io WebSockets
- **Build System**: Monorepo with npm workspaces

**Key Patterns**:
- Separation of public vs private game state
- Socket.io event-driven architecture for multi-device sync
- Shared TypeScript types between client and server
- Mobile-first design for player interface
- Large-screen optimized host interface

**Development Notes**:
- Always build shared package before building other apps
- Server runs on port 3001, host on 5173, player on 5174
- Use Socket.io events defined in `packages/shared/src/index.ts`
- Host app optimized for large screens (TV/laptop displays)
- Player app optimized for mobile touch interfaces