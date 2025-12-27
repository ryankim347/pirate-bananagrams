import { useState } from 'react';
import './Lobby.css';

function Lobby({ onCreateRoom, onJoinRoom, connected }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [reduceVowels, setReduceVowels] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (playerName.trim() && connected) {
      onCreateRoom(playerName.trim(), reduceVowels);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim() && connected) {
      onJoinRoom(roomCode.trim(), playerName.trim());
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h2>Welcome to Pirate Bananagrams!</h2>
        <p className="lobby-description">
          A fast-paced multiplayer word game where you claim and snatch words from tiles and other players.
        </p>

        <div className="name-input-section">
          <label htmlFor="playerName">Your Name</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            disabled={!connected}
          />
        </div>

        {!isJoining ? (
          <div className="create-room-section">
            <h3>Create a New Game</h3>
            <form onSubmit={handleCreateRoom}>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={reduceVowels}
                    onChange={(e) => setReduceVowels(e.target.checked)}
                    disabled={!connected}
                  />
                  <span>Reduce vowels (recommended)</span>
                </label>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!playerName.trim() || !connected}
              >
                Create Room
              </button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setIsJoining(true)}
              disabled={!connected}
            >
              Join Existing Room
            </button>
          </div>
        ) : (
          <div className="join-room-section">
            <h3>Join a Game</h3>
            <form onSubmit={handleJoinRoom}>
              <div className="input-group">
                <label htmlFor="roomCode">Room Code</label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  disabled={!connected}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!playerName.trim() || !roomCode.trim() || !connected}
              >
                Join Room
              </button>
            </form>

            <button
              className="btn btn-secondary"
              onClick={() => setIsJoining(false)}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;

