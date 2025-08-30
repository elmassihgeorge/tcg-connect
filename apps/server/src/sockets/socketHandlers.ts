import { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@tcgconnect/shared';
import { logger } from '@tcgconnect/shared';
import { GameManager } from '../game/GameManager';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketHandlers {
  constructor(
    private io: SocketIOServer,
    private gameManager: GameManager
  ) {}

  handleConnection(socket: TypedSocket): void {
    logger.info('Client connected', { socketId: socket.id });

    // Handle player joining a game
    socket.on('player:joined', async (data) => {
      try {
        const result = await this.gameManager.joinGame(socket, data);
        
        if (!result.success) {
          socket.emit('error:connection', result.message || 'Failed to join game');
          return;
        }

        // Emit game created event if this is a new game (host joining)
        if (data.role === 'host') {
          socket.emit('game:created', data.gameId);
        }
      } catch (error) {
        logger.error('Error joining game', { error });
        socket.emit('error:connection', 'Internal server error');
      }
    });

    // Handle player leaving a game
    socket.on('player:left', async () => {
      try {
        await this.gameManager.leaveGame(socket);
      } catch (error) {
        logger.error('Error leaving game', { error });
      }
    });

    // Handle game actions (placeholder for future expansion)
    socket.on('action:performed', (data) => {
      try {
        const { gameId, playerId } = socket.data;
        
        if (!gameId || !playerId) {
          socket.emit('error:invalid-action', 'Not in a game');
          return;
        }

        const gameState = this.gameManager.getGameState(gameId);
        if (!gameState) {
          socket.emit('error:invalid-action', 'Game not found');
          return;
        }

        // Basic validation - only current turn player can act
        if (gameState.currentTurn !== playerId) {
          socket.emit('error:invalid-action', 'Not your turn');
          return;
        }

        // Placeholder for game action logic - implement specific rules here
        logger.debug('Action performed', { playerId, gameId, action: data });
        
        // For now, just broadcast the game update
        this.gameManager.broadcastGameUpdate(gameId);
      } catch (error) {
        logger.error('Error handling action', { error });
        socket.emit('error:invalid-action', 'Failed to process action');
      }
    });

    // Handle turn ending (placeholder)
    socket.on('turn:ended', () => {
      try {
        const { gameId, playerId } = socket.data;
        
        if (!gameId || !playerId) {
          socket.emit('error:invalid-action', 'Not in a game');
          return;
        }

        const gameState = this.gameManager.getGameState(gameId);
        if (!gameState || gameState.currentTurn !== playerId) {
          socket.emit('error:invalid-action', 'Cannot end turn');
          return;
        }

        // Simple turn rotation logic (for demo)
        const currentIndex = gameState.players.findIndex(p => p.id === playerId);
        const nextIndex = (currentIndex + 1) % gameState.players.length;
        gameState.currentTurn = gameState.players[nextIndex].id;

        logger.debug('Turn ended', { playerId, nextTurn: gameState.currentTurn });
        this.gameManager.broadcastGameUpdate(gameId);
      } catch (error) {
        logger.error('Error ending turn', { error });
        socket.emit('error:invalid-action', 'Failed to end turn');
      }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      logger.info('Client disconnected', { socketId: socket.id, reason });
      
      try {
        await this.gameManager.leaveGame(socket);
      } catch (error) {
        logger.error('Error handling disconnect', { error });
      }
    });
  }
}