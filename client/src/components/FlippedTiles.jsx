import './FlippedTiles.css';

function FlippedTiles({ tiles }) {
  return (
    <div className="flipped-tiles-section">
      <h3>Available Tiles ({tiles.length})</h3>
      <div className="flipped-tiles">
        {tiles.length === 0 ? (
          <p className="no-tiles">No tiles flipped yet. Wait for someone to flip a tile.</p>
        ) : (
          tiles.map((tile, index) => (
            <div
              key={`tile-${index}-${tile}`}
              className="tile"
            >
              {tile}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FlippedTiles;

