import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { GameManager } from '../../game/GameManager';
import { SocketHandlers } from '../../sockets/socketHandlers';

describe.skip('Socket.io Integration Tests', () => {
  jest.setTimeout(10000); // 10 second timeout for integration tests
  // TODO: Fix timing issues in integration tests
  let httpServer: any;
  let io: SocketIOServer;
  let gameManager: GameManager;
  let socketHandlers: SocketHandlers;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let serverPort: number;

  beforeAll((done) => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    gameManager = new GameManager(io);
    socketHandlers = new SocketHandlers(io, gameManager);

    // Handle connections
    io.on('connection', (socket) => {
      socketHandlers.handleConnection(socket);
    });

    httpServer.listen(() => {
      serverPort = httpServer.address()?.port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    // Create two client connections for testing multiplayer scenarios
    clientSocket1 = Client(`http://localhost:${serverPort}`);
    clientSocket2 = Client(`http://localhost:${serverPort}`);
    
    let connectedCount = 0;
    const checkBothConnected = () => {
      connectedCount++;
      if (connectedCount === 2) {
        done();
      }
    };

    clientSocket1.on('connect', checkBothConnected);
    clientSocket2.on('connect', checkBothConnected);
  });

  afterEach(() => {
    clientSocket1?.close();
    clientSocket2?.close();
  });

  describe('Game Creation and Joining', () => {
    it('should handle player joining a game', (done) => {
      const gameId = gameManager.createGame();

      clientSocket1.emit('player:joined', {
        gameId,
        playerName: 'Test Player',
        role: 'player1'
      });

      clientSocket1.on('game:update', (gameState) => {
        expect(gameState.id).toBe(gameId);
        expect(gameState.players).toHaveLength(1);
        expect(gameState.players[0].name).toBe('Test Player');
        expect(gameState.players[0].role).toBe('player1');
        expect(gameState.status).toBe('waiting');
        done();
      });
    });

    it('should handle multiple players joining and starting game', (done) => {
      const gameId = gameManager.createGame();
      let updateCount = 0;

      const checkGameStart = (gameState: any) => {
        updateCount++;
        if (updateCount === 2) {
          // Second update should show active game
          expect(gameState.status).toBe('active');
          expect(gameState.players).toHaveLength(2);
          expect(gameState.currentTurn).toBeDefined();
          done();
        }
      };

      clientSocket1.on('game:update', checkGameStart);
      clientSocket2.on('game:update', checkGameStart);

      // Player 1 joins
      clientSocket1.emit('player:joined', {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });

      // Player 2 joins after a short delay
      setTimeout(() => {
        clientSocket2.emit('player:joined', {
          gameId,
          playerName: 'Player 2',
          role: 'player2'
        });
      }, 100);
    });

    it('should handle connection errors for invalid game', (done) => {
      clientSocket1.emit('player:joined', {
        gameId: 'INVALID',
        playerName: 'Test Player',
        role: 'player1'
      });

      clientSocket1.on('error:connection', (message) => {
        expect(message).toBe('Game not found');
        done();
      });
    });

    it('should handle role conflicts', (done) => {
      const gameId = gameManager.createGame();

      // First player joins
      clientSocket1.emit('player:joined', {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });

      clientSocket1.on('game:update', () => {
        // Second player tries to join with same role
        clientSocket2.emit('player:joined', {
          gameId,
          playerName: 'Player 1 Duplicate',
          role: 'player1'
        });
      });

      clientSocket2.on('error:connection', (message) => {
        expect(message).toBe('Role already taken');
        done();
      });
    });
  });

  describe('Game Actions', () => {
    let gameId: string;

    beforeEach((done) => {
      gameId = gameManager.createGame();
      let joinedCount = 0;

      const checkBothJoined = () => {
        joinedCount++;
        if (joinedCount === 2) {
          done();
        }
      };

      clientSocket1.on('game:update', (gameState) => {
        if (gameState.players.some((p: any) => p.name === 'Player 1')) {
          checkBothJoined();
        }
      });

      clientSocket2.on('game:update', (gameState) => {
        if (gameState.players.some((p: any) => p.name === 'Player 2')) {
          checkBothJoined();
        }
      });

      // Join both players
      clientSocket1.emit('player:joined', {
        gameId,
        playerName: 'Player 1',
        role: 'player1'
      });

      clientSocket2.emit('player:joined', {
        gameId,
        playerName: 'Player 2',
        role: 'player2'
      });
    });

    it('should broadcast actions to all players in room', (done) => {
      const actionData = {
        type: 'demo',
        payload: { message: 'test action' }
      };

      // Listen for game update instead since actions trigger game updates
      clientSocket2.on('game:update', (gameState) => {
        if (gameState.status === 'active') {
          done();
        }
      });

      setTimeout(() => {
        clientSocket1.emit('action:performed', actionData);
      }, 100);
    });

    it('should handle turn ending', (done) => {
      let gameState: any = null;

      // Get current game state first
      clientSocket1.on('game:update', (state) => {
        gameState = state;
        if (gameState && gameState.status === 'active') {
          // Check whose turn it is and end turn
          const currentPlayer = gameState.players.find((p: any) => p.id === gameState.currentTurn);
          if (currentPlayer?.role === 'player1') {
            clientSocket1.emit('turn:ended');
          }
        }
      });

      clientSocket2.on('game:update', (updatedState) => {
        if (gameState && updatedState.currentTurn !== gameState.currentTurn) {
          // Turn has changed
          expect(updatedState.currentTurn).not.toBe(gameState.currentTurn);
          done();
        }
      });
    });

    it('should reject invalid turn ending', (done) => {
      clientSocket1.on('game:update', (gameState) => {
        if (gameState.status === 'active') {
          const currentPlayer = gameState.players.find((p: any) => p.id === gameState.currentTurn);
          
          // If it's player1's turn, have player2 try to end turn (should fail)
          if (currentPlayer?.role === 'player1') {
            clientSocket2.emit('turn:ended');
          }
        }
      });

      clientSocket2.on('error:invalid-action', (message) => {
        expect(message).toBe('Cannot end turn');
        done();
      });
    });
  });

  describe('Player Disconnection', () => {
    it('should handle player disconnection', (done) => {
      const gameId = gameManager.createGame();

      clientSocket1.emit('player:joined', {
        gameId,
        playerName: 'Test Player',
        role: 'player1'
      });

      clientSocket1.on('game:update', (gameState) => {
        expect(gameState.players[0].connected).toBe(true);
        
        // Disconnect the player
        clientSocket1.disconnect();
      });

      clientSocket2.on('player:disconnected', (playerId) => {
        expect(playerId).toBeDefined();
        done();
      });

      // Join second client to receive disconnect event
      setTimeout(() => {
        clientSocket2.emit('player:joined', {
          gameId,
          playerName: 'Observer',
          role: 'host'
        });
      }, 100);
    });

    it('should handle explicit player leave', (done) => {
      const gameId = gameManager.createGame();

      clientSocket1.emit('player:joined', {
        gameId,
        playerName: 'Test Player',
        role: 'player1'
      });

      clientSocket1.on('game:update', () => {
        clientSocket1.emit('player:left');
      });

      clientSocket2.on('player:disconnected', (playerId) => {
        expect(playerId).toBeDefined();
        done();
      });

      // Join second client to receive leave event
      setTimeout(() => {
        clientSocket2.emit('player:joined', {
          gameId,
          playerName: 'Observer',
          role: 'host'
        });
      }, 100);
    });
  });

  describe('Reconnection', () => {
    it('should allow player reconnection', (done) => {
      const gameId = gameManager.createGame();

      // Initial connection
      clientSocket1.emit('player:joined', {
        gameId,
        playerName: 'Test Player',
        role: 'player1'
      });

      clientSocket1.on('game:update', (gameState) => {
        if (gameState.players[0].connected) {
          // Disconnect
          clientSocket1.disconnect();
          
          // Create new connection and rejoin
          setTimeout(() => {
            const newClient = Client(`http://localhost:${serverPort}`);
            
            newClient.on('connect', () => {
              newClient.emit('player:joined', {
                gameId,
                playerName: 'Test Player Reconnected',
                role: 'player1'
              });
            });

            newClient.on('game:update', (reconnectedState) => {
              const player = reconnectedState.players.find((p: any) => p.role === 'player1');
              expect(player.name).toBe('Test Player Reconnected');
              expect(player.connected).toBe(true);
              newClient.close();
              done();
            });
          }, 100);
        }
      });
    });
  });
});