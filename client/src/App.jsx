import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

const STORAGE_KEY = 'pirate-bananagrams-session';

function App() {
  const { socket, connected, emit, on } = useSocket();
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (roomCode && playerId && gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        roomCode,
        playerId,
        playerName: gameState.players.find(p => p.id === playerId)?.name,
        timestamp: Date.now()
      }));
    }
  }, [roomCode, playerId, gameState]);

  // Try to reconnect on mount
  useEffect(() => {
    if (!connected || isReconnecting) return;

    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (!savedSession) return;

    try {
      const session = JSON.parse(savedSession);
      const timeSinceDisconnect = Date.now() - session.timestamp;
      
      // Only auto-reconnect if disconnected less than 5 minutes ago
      if (timeSinceDisconnect < 5 * 60 * 1000) {
        setIsReconnecting(true);
        console.log('Attempting to reconnect to room:', session.roomCode);
        
        // Try to rejoin the room
        emit('joinRoom', { 
          roomCode: session.roomCode, 
          playerName: session.playerName 
        }, (response) => {
          setIsReconnecting(false);
          if (response.success) {
            setPlayerId(response.playerId);
            setRoomCode(session.roomCode);
            setGameState(response.gameState);
            setError(null);
            console.log('Successfully reconnected!');
          } else {
            // Room no longer exists or game ended
            localStorage.removeItem(STORAGE_KEY);
            console.log('Could not reconnect:', response.error);
          }
        });
      } else {
        // Session too old, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Error parsing saved session:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [connected, emit, isReconnecting]);

  // Warn before closing/refreshing during active game
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You are in an active game. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState]);

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
    // Clear session storage when intentionally leaving
    localStorage.removeItem(STORAGE_KEY);
    setGameState(null);
    setPlayerId(null);
    setRoomCode(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={handleLeaveRoom} style={{ cursor: 'pointer' }}>
          🏴‍☠️ Pirate Bananagrams
        </h1>
        {!connected && <div className="connection-status">Connecting...</div>}
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {isReconnecting && (
          <div className="reconnecting-banner">
            🔄 Reconnecting to your game...
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
