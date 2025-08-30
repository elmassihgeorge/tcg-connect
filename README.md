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

**Option 1: Native Development**
- Node.js 18+ 
- npm 9+

**Option 2: Docker Development** (Recommended)
- Docker Desktop
- Docker Compose V2

### Installation

```bash
git clone https://github.com/your-username/TCGConnect.git
cd TCGConnect
cp .env.example .env
```

### Development

**Option 1: Docker (Recommended)**
```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

**Option 2: Native Development**
```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Or start individually:
npm run dev:server    # Backend server (port 3001)
npm run dev:host      # Host display (port 5173)
npm run dev:player    # Player interface (port 5174)
```

### Build for Production

**Docker Production Build**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Native Production Build**
```bash
npm run build
```

### Access the Applications

- **Host Display**: http://localhost:5173
- **Player Interface**: http://localhost:5174  
- **Server API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Development Workflow

1. **Host Setup**: Open host app on laptop/TV browser at `http://localhost:5173`
2. **Player Connection**: Players join via mobile browsers at `http://localhost:5174`
3. **Game Flow**: Real-time synchronization handles all game state updates

## Docker Development

The project includes comprehensive Docker support for development and production:

### Development with Docker
- **Hot Reload**: All source code changes are automatically reflected
- **Volume Mounts**: Local code is mounted into containers for live editing
- **Persistent Dependencies**: Node modules are cached in Docker volumes
- **Service Dependencies**: Proper startup order with health checks

### Production Deployment
- **Multi-stage Builds**: Optimized images for production
- **Nginx Serving**: Static assets served by nginx with proper caching
- **Health Checks**: Built-in health monitoring for all services
- **Security Headers**: Production security headers configured

### Useful Docker Commands
```bash
# View service status
docker-compose ps

# Access service logs
docker-compose logs server
docker-compose logs host
docker-compose logs player

# Execute commands in running containers
docker-compose exec server npm test
docker-compose exec host npm run lint

# Reset everything (including volumes)
docker-compose down -v --remove-orphans
```

## Testing

```bash
# Native testing
npm run test
npm run lint
npm run typecheck

# Docker testing
docker-compose exec server npm run test
docker-compose exec server npm run lint
```

## Contributing

This project uses a monorepo structure with shared TypeScript types. See `CLAUDE.md` for detailed development guidance.

### Code Quality
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Automated testing with Jest
- GitHub Actions CI/CD pipeline

## License

MIT License - see LICENSE file for details