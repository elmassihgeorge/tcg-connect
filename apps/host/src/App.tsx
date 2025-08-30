import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { generateId } from '@tcgconnect/shared';
import './App.css';

function App() {
  const [gameId, setGameId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('Host');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  
  const socket = useSocket({
    gameId: isJoined ? gameId : undefined,
    playerName: isJoined ? playerName : undefined,
    role: 'host',
    autoConnect: isJoined
  });

  const createGame = () => {
    const newGameId = generateId();
    setGameId(newGameId);
    setIsJoined(true);
    socket.connect();
    socket.joinGame(newGameId, playerName, 'host');
  };

  const joinExistingGame = () => {
    if (!gameId.trim()) return;
    setIsJoined(true);
    socket.connect();
    socket.joinGame(gameId, playerName, 'host');
  };

  const leaveGame = () => {
    socket.leaveGame();
    socket.disconnect();
    setIsJoined(false);
    setGameId('');
  };

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            TCG Connect - Host
          </h1>
          
          <div className="mb-4">
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

          <div className="space-y-3">
            <button
              onClick={createGame}
              disabled={!playerName.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Create New Game
            </button>
            
            <div className="text-center text-gray-500">or</div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Game ID"
              />
              <button
                onClick={joinExistingGame}
                disabled={!gameId.trim() || !playerName.trim()}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">TCG Connect - Host Display</h1>
              <p className="text-gray-600">Game ID: {gameId}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                socket.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {socket.connected ? 'Connected' : 'Disconnected'}
              </span>
              <button
                onClick={leaveGame}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>

        {socket.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {socket.error}
            <button
              onClick={socket.clearError}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            <div className="space-y-2">
              {socket.players.map((player) => (
                <div key={player.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{player.name}</span>
                    <span className="ml-2 text-sm text-gray-500">({player.role})</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    player.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {player.connected ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
              {socket.players.length === 0 && (
                <p className="text-gray-500 text-center py-4">No players connected</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Game State</h2>
            {socket.gameState ? (
              <div className="space-y-2">
                <div>Status: <span className="font-medium capitalize">{socket.gameState.status}</span></div>
                <div>Current Turn: <span className="font-medium">{
                  socket.players.find(p => p.id === socket.gameState?.currentTurn)?.name || 'None'
                }</span></div>
                <div>Players: {socket.players.length}</div>
                <div className="mt-4">
                  <button
                    onClick={() => socket.performAction('demo', { message: 'Host action' })}
                    disabled={!socket.connected}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded mr-2"
                  >
                    Demo Action
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No game state available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
