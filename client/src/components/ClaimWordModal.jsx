import { useState } from 'react';
import './ClaimWordModal.css';

function ClaimWordModal({ selectedTiles, selectedWords, isSnatch, onSubmit, onClose }) {
  const [word, setWord] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (word.trim()) {
      onSubmit(word.trim().toUpperCase());
    }
  };

  const allTiles = isSnatch 
    ? [...selectedWords.join('').split(''), ...selectedTiles]
    : selectedTiles;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isSnatch ? '🏴‍☠️ Snatch Word' : '✨ Claim Word'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isSnatch && selectedWords.length > 0 && (
            <div className="snatch-info">
              <p className="label">Snatching:</p>
              <div className="snatched-words">
                {selectedWords.map((w, i) => (
                  <span key={i} className="word-badge">{w}</span>
                ))}
              </div>
            </div>
          )}

          {selectedTiles.length > 0 && (
            <div className="tiles-info">
              <p className="label">+ Table tiles:</p>
              <div className="selected-tiles">
                {selectedTiles.map((tile, i) => (
                  <span key={i} className="tile">{tile}</span>
                ))}
              </div>
            </div>
          )}

          <div className="all-tiles-info">
            <p className="label">Available letters:</p>
            <div className="all-tiles">
              {allTiles.map((tile, i) => (
                <span key={i} className="tile-small">{tile}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="word-input">Enter your word:</label>
              <input
                id="word-input"
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value.toUpperCase())}
                placeholder="Type the word..."
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!word.trim()}>
                {isSnatch ? 'Snatch!' : 'Claim'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClaimWordModal;

