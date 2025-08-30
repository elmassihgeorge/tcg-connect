import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import './App.css';

function App() {
  const [gameId, setGameId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'player1' | 'player2'>('player1');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  
  const socket = useSocket({
    gameId: isJoined ? gameId : undefined,
    playerName: isJoined ? playerName : undefined,
    role: isJoined ? selectedRole : undefined,
    autoConnect: isJoined
  });

  const joinGame = () => {
    if (!gameId.trim() || !playerName.trim()) return;
    setIsJoined(true);
    socket.connect();
    socket.joinGame(gameId, playerName, selectedRole);
  };

  const leaveGame = () => {
    socket.leaveGame();
    socket.disconnect();
    setIsJoined(false);
    setGameId('');
    setPlayerName('');
  };

  const isMyTurn = socket.gameState?.currentTurn === socket.players.find(p => p.role === selectedRole)?.id;

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            TCG Connect - Player
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game ID
              </label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter game ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player Role
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRole('player1')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedRole === 'player1'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Player 1
                </button>
                <button
                  onClick={() => setSelectedRole('player2')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedRole === 'player2'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Player 2
                </button>
              </div>
            </div>

            <button
              onClick={joinGame}
              disabled={!gameId.trim() || !playerName.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-md transition-colors text-lg"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-bold text-gray-800">TCG Connect</h1>
            <span className={`px-2 py-1 rounded text-xs ${
              socket.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {socket.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <div>Game: {gameId}</div>
            <div>Role: {selectedRole}</div>
            <div>Name: {playerName}</div>
          </div>
          <button
            onClick={leaveGame}
            className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm transition-colors"
          >
            Leave Game
          </button>
        </div>

        {/* Error Display */}
        {socket.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <span className="text-sm">{socket.error}</span>
              <button
                onClick={socket.clearError}
                className="text-red-500 hover:text-red-700 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Game Status */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Game Status</h2>
          {socket.gameState ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize">{socket.gameState.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Players:</span>
                <span className="font-medium">{socket.players.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Turn:</span>
                <span className={`font-medium ${isMyTurn ? 'text-green-600' : 'text-red-600'}`}>
                  {isMyTurn ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Waiting for game state...</p>
          )}
        </div>

        {/* Players */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Players</h2>
          <div className="space-y-2">
            {socket.players.map((player) => (
              <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <div>
                  <span className="font-medium">{player.name}</span>
                  <span className="ml-1 text-gray-500">({player.role})</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  player.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {player.connected ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => socket.performAction('demo', { message: `${selectedRole} action` })}
              disabled={!socket.connected || !isMyTurn}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-md text-sm transition-colors"
            >
              Demo Action
            </button>
            
            <button
              onClick={socket.endTurn}
              disabled={!socket.connected || !isMyTurn}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-md text-sm transition-colors"
            >
              End Turn
            </button>
          </div>
          
          {!isMyTurn && socket.gameState?.status === 'active' && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Waiting for {socket.players.find(p => p.id === socket.gameState?.currentTurn)?.name || 'other player'}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
