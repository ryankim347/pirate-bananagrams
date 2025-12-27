import './TilePool.css';

function TilePool({ tilesRemaining, canFlip, isMyTurn, currentTurnPlayer, onFlipTile }) {
  return (
    <div className="tile-pool">
      <div className="tile-pool-info">
        <div className="tiles-remaining">
          <div className="tile-stack">
            {Array.from({ length: Math.min(5, Math.ceil(tilesRemaining / 20)) }).map((_, i) => (
              <div key={i} className="tile-stack-layer" style={{ top: `-${i * 2}px` }} />
            ))}
          </div>
          <span className="tile-count">{tilesRemaining} tiles remaining</span>
        </div>
        <div className="turn-indicator">
          {isMyTurn ? (
            <span className="your-turn">Your Turn!</span>
          ) : (
            <span className="waiting-turn">
              {currentTurnPlayer ? `${currentTurnPlayer}'s turn` : 'Waiting...'}
            </span>
          )}
        </div>
      </div>
      <button
        className="btn btn-flip"
        onClick={onFlipTile}
        disabled={!canFlip}
      >
        {canFlip ? '🎲 Flip Tile' : isMyTurn ? 'No tiles left' : 'Wait for your turn'}
      </button>
    </div>
  );
}

export default TilePool;

