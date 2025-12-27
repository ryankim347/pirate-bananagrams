import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

function App() {
  const { socket, connected, emit, on } = useSocket();
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateRoom = (playerName, reduceVowels) => {
    emit('createRoom', { playerName, reduceVowels }, (response) => {
      if (response.success) {
        setPlayerId(response.playerId);
        setRoomCode(response.roomCode);
        setGameState(response.gameState);
        setError(null);
      } else {
        setError(response.error);
      }
    });
  };

  const handleJoinRoom = (roomCode, playerName) => {
    emit('joinRoom', { roomCode, playerName }, (response) => {
      if (response.success) {
        setPlayerId(response.playerId);
        setRoomCode(roomCode.toUpperCase());
        setGameState(response.gameState);
        setError(null);
      } else {
        setError(response.error);
      }
    });
  };

  const handleLeaveRoom = () => {
    setGameState(null);
    setPlayerId(null);
    setRoomCode(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏴‍☠️ Pirate Bananagrams</h1>
        {!connected && <div className="connection-status">Connecting...</div>}
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {!gameState ? (
          <Lobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            connected={connected}
          />
        ) : (
          <Game
            socket={socket}
            emit={emit}
            on={on}
            gameState={gameState}
            setGameState={setGameState}
            playerId={playerId}
            roomCode={roomCode}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </main>
    </div>
  );
}

export default App;
