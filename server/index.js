const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const GameManager = require('./GameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const gameManager = new GameManager();
const PORT = process.env.PORT || 3001;

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: gameManager.getActiveGames() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on('createRoom', ({ playerName, reduceVowels = false }, callback) => {
    try {
      const { roomCode, game } = gameManager.createRoom(playerName, socket.id, reduceVowels);
      socket.join(roomCode);
      
      console.log(`Room created: ${roomCode} by ${playerName}`);
      
      if (callback) {
        callback({
          success: true,
          roomCode,
          playerId: socket.id,
          gameState: game.getState(),
        });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
    try {
      const result = gameManager.joinRoom(roomCode, playerName, socket.id);
      
      if (!result.success) {
        if (callback) {
          callback({ success: false, error: result.error });
        }
        return;
      }
      
      const { game } = result;
      socket.join(roomCode.toUpperCase());
      
      console.log(`${playerName} joined room: ${roomCode}`);
      
      // Notify existing players
      socket.to(roomCode.toUpperCase()).emit('playerJoined', {
        player: game.players.get(socket.id),
      });
      
      if (callback) {
        callback({
          success: true,
          playerId: socket.id,
          gameState: game.getState(),
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Start the game
  socket.on('startGame', (callback) => {
    try {
      const game = gameManager.getGameByPlayer(socket.id);
      if (!game) {
        if (callback) callback({ success: false, error: 'Game not found' });
        return;
      }

      const player = game.players.get(socket.id);
      if (!player?.isHost) {
        if (callback) callback({ success: false, error: 'Only host can start game' });
        return;
      }

      if (game.players.size < 2) {
        if (callback) callback({ success: false, error: 'Need at least 2 players' });
        return;
      }

      game.startGame();
      
      console.log(`Game started in room: ${game.roomCode}`);
      
      io.to(game.roomCode).emit('gameStarted', {
        gameState: game.getState(),
      });
      
      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error starting game:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Flip a tile
  socket.on('flipTile', (callback) => {
    try {
      const game = gameManager.getGameByPlayer(socket.id);
      if (!game) {
        if (callback) callback({ success: false, error: 'Game not found' });
        return;
      }

      const result = game.flipTile(socket.id);
      
      if (!result.success) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      console.log(`Tile flipped in ${game.roomCode}: ${result.tile}`);
      
      io.to(game.roomCode).emit('tileFlipped', {
        tile: result.tile,
        flippedTiles: game.flippedTiles,
        tilesRemaining: game.tilePool.length,
        currentTurn: game.currentTurn,
      });
      
      if (callback) {
        callback({ success: true, tile: result.tile });
      }
    } catch (error) {
      console.error('Error flipping tile:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Claim a word
  socket.on('claimWord', ({ word, tiles }, callback) => {
    try {
      const game = gameManager.getGameByPlayer(socket.id);
      if (!game) {
        if (callback) callback({ success: false, error: 'Game not found' });
        return;
      }

      const result = game.claimWord(socket.id, word, tiles);
      
      if (!result.success) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      const player = game.players.get(socket.id);
      console.log(`${player.name} claimed word: ${word}`);
      
      io.to(game.roomCode).emit('wordClaimed', {
        playerId: socket.id,
        playerName: player.name,
        word,
        tiles,
        flippedTiles: game.flippedTiles,
      });
      
      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error claiming word:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Snatch a word
  socket.on('snatchWord', ({ targetPlayerId, oldWords, tableTiles, newWord }, callback) => {
    try {
      const game = gameManager.getGameByPlayer(socket.id);
      if (!game) {
        if (callback) callback({ success: false, error: 'Game not found' });
        return;
      }

      const result = game.snatchWord(socket.id, targetPlayerId, oldWords, tableTiles, newWord);
      
      if (!result.success) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      const snatcher = game.players.get(socket.id);
      const target = game.players.get(targetPlayerId);
      
      console.log(`${snatcher.name} snatched from ${target?.name || 'self'}: ${oldWords.join(', ')} -> ${newWord}`);
      
      io.to(game.roomCode).emit('wordSnatched', {
        snatcherId: socket.id,
        snatcherName: snatcher.name,
        targetId: targetPlayerId,
        targetName: target?.name,
        oldWords,
        newWord,
        flippedTiles: game.flippedTiles,
      });
      
      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error snatching word:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // End the game
  socket.on('endGame', (callback) => {
    try {
      const game = gameManager.getGameByPlayer(socket.id);
      if (!game) {
        if (callback) callback({ success: false, error: 'Game not found' });
        return;
      }

      const player = game.players.get(socket.id);
      if (!player?.isHost) {
        if (callback) callback({ success: false, error: 'Only host can end game' });
        return;
      }

      game.endGame();
      
      console.log(`Game ended in room: ${game.roomCode}`);
      
      io.to(game.roomCode).emit('gameEnded', {
        finalScores: game.getFinalScores(),
      });
      
      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error('Error ending game:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const result = gameManager.removePlayer(socket.id);
    if (result) {
      const { roomCode, game, wasHost } = result;
      
      if (game && game.players.size > 0) {
        io.to(roomCode).emit('playerLeft', {
          playerId: socket.id,
          wasHost,
          newHost: wasHost ? Array.from(game.players.keys())[0] : null,
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎮 Snatch server running on port ${PORT}`);
  console.log(`🌐 Client should connect to: http://localhost:${PORT}`);
});

