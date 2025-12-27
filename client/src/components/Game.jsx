import { useEffect, useState } from 'react';
import TilePool from './TilePool';
import FlippedTiles from './FlippedTiles';
import PlayerWords from './PlayerWords';
import ClaimWordModal from './ClaimWordModal';
import './Game.css';

function Game({ socket, emit, on, gameState, setGameState, playerId, roomCode, onLeaveRoom }) {
  const [selectedWords, setSelectedWords] = useState([]);
  const [selectedWordPlayer, setSelectedWordPlayer] = useState(null);
  const [notification, setNotification] = useState(null);
  const [waitingForStart, setWaitingForStart] = useState(true);
  const [wordInput, setWordInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (gameState.status === 'playing') {
      setWaitingForStart(false);
    }
  }, [gameState.status]);

  useEffect(() => {
    if (!socket) return;

    const unsubscribers = [];

    // Player joined
    unsubscribers.push(on('playerJoined', ({ player }) => {
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, player],
      }));
      showNotification(`${player.name} joined the game`);
    }));

    // Player left
    unsubscribers.push(on('playerLeft', ({ playerId: leftPlayerId, wasHost, newHost }) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== leftPlayerId).map(p => ({
          ...p,
          isHost: p.id === newHost ? true : p.isHost,
        })),
      }));
    }));

    // Game started
    unsubscribers.push(on('gameStarted', ({ gameState: newState }) => {
      setGameState(newState);
      setWaitingForStart(false);
      showNotification('Game started! 🎮');
    }));

    // Tile flipped
    unsubscribers.push(on('tileFlipped', ({ tile, flippedTiles, tilesRemaining, currentTurn }) => {
      setGameState(prev => ({
        ...prev,
        flippedTiles,
        tilesRemaining,
        currentTurn,
      }));
      showNotification(`Tile flipped: ${tile}`, 1000);
    }));

    // Word claimed
    unsubscribers.push(on('wordClaimed', ({ playerId: claimerId, playerName, word, flippedTiles }) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === claimerId
            ? { 
                ...p, 
                words: [...p.words, word], 
                score: [...p.words, word].reduce((sum, w) => sum + w.length, 0)
              }
            : p
        ),
        flippedTiles,
      }));
      showNotification(`${playerName} claimed: ${word} ✨`);
    }));

    // Word snatched
    unsubscribers.push(on('wordSnatched', ({ snatcherId, snatcherName, targetId, oldWords, newWord, flippedTiles }) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => {
          if (p.id === snatcherId) {
            const newWords = [...p.words, newWord];
            return { 
              ...p, 
              words: newWords, 
              score: newWords.reduce((sum, w) => sum + w.length, 0)
            };
          }
          if (p.id === targetId) {
            const updatedWords = p.words.filter(w => !oldWords.includes(w));
            return { 
              ...p, 
              words: updatedWords, 
              score: updatedWords.reduce((sum, w) => sum + w.length, 0)
            };
          }
          return p;
        }),
        flippedTiles,
      }));
      showNotification(`${snatcherName} stole: ${oldWords.join('+')} → ${newWord} 🏴‍☠️`);
    }));

    // Game ended
    unsubscribers.push(on('gameEnded', ({ finalScores }) => {
      setGameState(prev => ({ ...prev, status: 'finished' }));
      const winner = finalScores[0];
      showNotification(`Game Over! Winner: ${winner.name} with ${winner.score} tiles! 🏆`, 5000);
    }));

    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [socket, on, setGameState]);

  const showNotification = (message, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  const handleStartGame = () => {
    emit('startGame', (response) => {
      if (!response.success) {
        showNotification(`Error: ${response.error}`);
      }
    });
  };

  const handleFlipTile = () => {
    emit('flipTile', (response) => {
      if (!response.success) {
        showNotification(`Error: ${response.error}`);
      }
    });
  };

  // Helper function to check if tiles can spell a word
  const canSpellWord = (word, availableTiles) => {
    const wordLetters = word.toUpperCase().split('');
    const tilesCopy = [...availableTiles];
    const usedTiles = [];
    
    for (const letter of wordLetters) {
      const index = tilesCopy.indexOf(letter);
      if (index === -1) {
        return { valid: false, tiles: [] };
      }
      usedTiles.push(letter);
      tilesCopy.splice(index, 1);
    }
    
    return { valid: true, tiles: usedTiles };
  };

  const handleSubmitWord = (e) => {
    e.preventDefault();
    const word = wordInput.trim().toUpperCase();
    
    if (!word || word.length < 3) {
      showNotification('Word must be at least 3 letters');
      return;
    }

    if (gameState.status !== 'playing') {
      showNotification('Game is not in progress');
      return;
    }

    setIsValidating(true);

    if (selectedWords.length > 0) {
      // Snatching mode
      const allOldTiles = selectedWords.join('').split('');
      const combinedTiles = [...allOldTiles, ...gameState.flippedTiles];
      const result = canSpellWord(word, combinedTiles);
      
      if (!result.valid) {
        showNotification('Cannot spell that word with selected words + available tiles');
        setIsValidating(false);
        return;
      }

      // Calculate which tiles come from the table
      const tableTiles = [];
      const wordLetters = word.split('');
      const oldTilesCopy = [...allOldTiles];
      
      for (const letter of wordLetters) {
        const oldIndex = oldTilesCopy.indexOf(letter);
        if (oldIndex === -1) {
          tableTiles.push(letter);
        } else {
          oldTilesCopy.splice(oldIndex, 1);
        }
      }

      emit('snatchWord', {
        targetPlayerId: selectedWordPlayer,
        oldWords: selectedWords,
        tableTiles: tableTiles,
        newWord: word,
      }, (response) => {
        setIsValidating(false);
        if (response.success) {
          setWordInput('');
          setSelectedWords([]);
          setSelectedWordPlayer(null);
        } else {
          showNotification(`Error: ${response.error}`);
        }
      });
    } else {
      // Claiming mode - check if word can be spelled from table
      const result = canSpellWord(word, gameState.flippedTiles);
      
      if (!result.valid) {
        showNotification('Cannot spell that word with available tiles');
        setIsValidating(false);
        return;
      }

      emit('claimWord', { word, tiles: result.tiles }, (response) => {
        setIsValidating(false);
        if (response.success) {
          setWordInput('');
        } else {
          showNotification(`Error: ${response.error}`);
        }
      });
    }
  };

  const handleWordClick = (word, playerIdOwner) => {
    if (selectedWords.includes(word) && selectedWordPlayer === playerIdOwner) {
      setSelectedWords(selectedWords.filter(w => w !== word));
      if (selectedWords.length === 1) {
        setSelectedWordPlayer(null);
      }
    } else {
      if (selectedWordPlayer === null || selectedWordPlayer === playerIdOwner) {
        setSelectedWords([...selectedWords, word]);
        setSelectedWordPlayer(playerIdOwner);
      } else {
        showNotification('Cannot select words from different players');
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedWords([]);
    setSelectedWordPlayer(null);
    setWordInput('');
  };

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost;
  const isMyTurn = gameState.currentTurn === playerId;
  const canFlip = gameState.status === 'playing' && isMyTurn && gameState.tilesRemaining > 0;

  return (
    <div className="game">
      <div className="game-header">
        <div className="game-info">
          <h2>Room: {roomCode}</h2>
          <div className="player-count">
            {gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''}
          </div>
        </div>
        {waitingForStart && isHost && gameState.players.length >= 2 && (
          <button className="btn btn-primary" onClick={handleStartGame}>
            Start Game
          </button>
        )}
        {gameState.status === 'finished' && (
          <button className="btn btn-secondary" onClick={onLeaveRoom}>
            Leave Room
          </button>
        )}
      </div>

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      {waitingForStart && (
        <div className="waiting-room">
          <h3>Waiting Room</h3>
          <p>Waiting for host to start the game...</p>
          <p className="min-players">
            {gameState.players.length < 2 ? 'Need at least 2 players to start' : 'Ready to start!'}
          </p>
          <div className="player-list">
            {gameState.players.map(player => (
              <div key={player.id} className="player-item">
                {player.name}
                {player.isHost && <span className="host-badge">Host</span>}
                {player.id === playerId && <span className="you-badge">You</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!waitingForStart && (
        <>
          <TilePool
            tilesRemaining={gameState.tilesRemaining}
            canFlip={canFlip}
            isMyTurn={isMyTurn}
            currentTurnPlayer={gameState.players.find(p => p.id === gameState.currentTurn)?.name}
            onFlipTile={handleFlipTile}
          />

          <FlippedTiles
            tiles={gameState.flippedTiles}
          />

          <div className="word-input-section">
            <form onSubmit={handleSubmitWord} className="word-input-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value.toUpperCase())}
                  placeholder={selectedWords.length > 0 ? "Type word to steal..." : "Type a word to claim..."}
                  disabled={gameState.status !== 'playing' || isValidating}
                  maxLength={20}
                  autoComplete="off"
                  className="word-input"
                />
                <button
                  type="submit"
                  className={`btn ${selectedWords.length > 0 ? 'btn-warning' : 'btn-success'}`}
                  disabled={!wordInput.trim() || gameState.status !== 'playing' || isValidating}
                >
                  {isValidating ? '⏳' : selectedWords.length > 0 ? '🏴‍☠️ Steal!' : '✨ Claim'}
                </button>
                {selectedWords.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearSelection}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              {selectedWords.length > 0 && (
                <div className="snatch-preview">
                  <strong>Stealing:</strong> {selectedWords.join(' + ')} → ?
                </div>
              )}
              <div className="word-hint">
                {selectedWords.length === 0 ? (
                  <>Available: {gameState.flippedTiles.join(', ') || 'No tiles yet'}</>
                ) : (
                  <>Available: {selectedWords.join('') + ' + ' + gameState.flippedTiles.join(', ')}</>
                )}
              </div>
            </form>
          </div>

          <div className="players-section">
            <h3>Players & Words</h3>
            <div className="players-grid">
              {gameState.players.map(player => (
                <PlayerWords
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === playerId}
                  selectedWords={selectedWordPlayer === player.id ? selectedWords : []}
                  onWordClick={(word) => handleWordClick(word, player.id)}
                  canSelect={gameState.status === 'playing'}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Game;

