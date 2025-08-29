# TCGConnect

A multi-device Pokemon TCG simulator that enables face-to-face gameplay with digital convenience.

## Concept

TCGConnect reimagines digital card gaming by combining the social aspect of physical play with the convenience of digital cards. Players sit across from each other with a central display (laptop/TV) showing the public game state, while each player uses their phone to manage their private hand and deck.

## Features

- **Multi-device gameplay**: Central host display + individual player phones
- **Real-time synchronization**: All devices stay in sync via WebSocket connections
- **Hybrid experience**: Face-to-face social interaction with digital card management
- **Cross-platform**: Web-based for universal device compatibility

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Player 1      │    │   Player 2      │
│   (Phone)       │    │   (Phone)       │
│                 │    │                 │
│ Private Hand    │    │ Private Hand    │
│ Deck Status     │    │ Deck Status     │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │    WebSocket         │
          │    Connection        │
          │                      │
          └──────┬─────┬─────────┘
                 │     │
         ┌───────▼─────▼───────┐
         │     Server          │
         │   (Node.js +        │
         │   Socket.io)        │
         └───────┬─────────────┘
                 │
         ┌───────▼─────────────┐
         │   Host Display      │
         │   (Laptop/TV)       │
         │                     │
         │ Public Game State   │
         │ Board Position      │
         │ Turn Indicator      │
         │ Scores & Stats      │
         └─────────────────────┘
```

## Project Structure

```
TCGConnect/
├── apps/
│   ├── server/          # Backend API & WebSocket server
│   ├── host/            # Central display application
│   └── player/          # Mobile player interface
├── packages/
│   └── shared/          # Shared types and utilities
└── CLAUDE.md           # Development guidance
```

## Technology Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Real-time Communication**: WebSocket via Socket.io
- **Build System**: Monorepo with npm workspaces

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation
```bash
git clone <repository-url>
cd TCGConnect
npm install
npm install --workspaces
```

### Development
```bash
# Start all services
npm run dev

# Or start individually:
npm run dev:server    # Backend server (port 3001)
npm run dev:host      # Host display (port 5173)
npm run dev:player    # Player interface (port 5174)
```

### Build
```bash
npm run build
```

## Development Workflow

1. **Host Setup**: Open host app on laptop/TV browser at `http://localhost:5173`
2. **Player Connection**: Players join via mobile browsers at `http://localhost:5174`
3. **Game Flow**: Real-time synchronization handles all game state updates

## Contributing

This project uses a monorepo structure with shared TypeScript types. See `CLAUDE.md` for detailed development guidance.

## License

MIT License - see LICENSE file for details