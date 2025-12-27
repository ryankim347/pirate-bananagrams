import './PlayerWords.css';

function PlayerWords({ player, isCurrentPlayer, selectedWords, onWordClick, canSelect }) {
  return (
    <div className={`player-words ${isCurrentPlayer ? 'current-player' : ''}`}>
      <div className="player-header">
        <h4>{player.name}</h4>
        {isCurrentPlayer && <span className="you-badge">You</span>}
        {player.isHost && <span className="host-badge">Host</span>}
      </div>
      <div className="player-score">
        {player.score} {player.score === 1 ? 'tile' : 'tiles'}
      </div>
      <div className="words-list">
        {player.words.length === 0 ? (
          <p className="no-words">No words yet</p>
        ) : (
          player.words.map((word, index) => {
            const isSelected = selectedWords.includes(word);
            return (
              <button
                key={index}
                className={`word-badge ${isSelected ? 'selected' : ''} ${canSelect ? 'selectable' : ''}`}
                onClick={() => canSelect && onWordClick(word)}
                disabled={!canSelect}
              >
                {word}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PlayerWords;

