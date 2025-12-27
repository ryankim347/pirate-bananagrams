const Game = require('./Game');

/**
 * GameManager manages multiple game rooms
 */
class GameManager {
  constructor() {
    this.games = new Map(); // roomCode -> Game
    this.playerRooms = new Map(); // socketId -> roomCode
  }

  /**
   * Generate a unique room code
   * @returns {string} 6-character room code
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like I, O, 0, 1
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.games.has(code));
    return code;
  }

  /**
   * Create a new game room
   * @param {string} playerName - Name of the host player
   * @param {string} socketId - Socket ID of the host
   * @param {boolean} reduceVowels - Whether to use reduced vowel distribution
   * @returns {Object} { roomCode, game }
   */
  createRoom(playerName, socketId, reduceVowels = false) {
    const roomCode = this.generateRoomCode();
    const game = new Game(roomCode, reduceVowels);
    game.addPlayer(socketId, playerName, true); // true = host
    
    this.games.set(roomCode, game);
    this.playerRooms.set(socketId, roomCode);
    
    return { roomCode, game };
  }

  /**
   * Join an existing game room
   * @param {string} roomCode - Room code to join
   * @param {string} playerName - Name of the joining player
   * @param {string} socketId - Socket ID of the joining player
   * @returns {Object|null} { success, game, error }
   */
  joinRoom(roomCode, playerName, socketId) {
    const game = this.games.get(roomCode.toUpperCase());
    
    if (!game) {
      return { success: false, error: 'Room not found' };
    }
    
    if (game.status !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }
    
    if (game.players.size >= 8) {
      return { success: false, error: 'Room is full' };
    }
    
    game.addPlayer(socketId, playerName, false);
    this.playerRooms.set(socketId, roomCode.toUpperCase());
    
    return { success: true, game };
  }

  /**
   * Get game by room code
   * @param {string} roomCode
   * @returns {Game|undefined}
   */
  getGame(roomCode) {
    return this.games.get(roomCode.toUpperCase());
  }

  /**
   * Get game by player socket ID
   * @param {string} socketId
   * @returns {Game|undefined}
   */
  getGameByPlayer(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    return roomCode ? this.games.get(roomCode) : undefined;
  }

  /**
   * Remove a player from their game
   * @param {string} socketId
   * @returns {Object|null} { roomCode, game, wasHost }
   */
  removePlayer(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return null;
    
    const game = this.games.get(roomCode);
    if (!game) return null;
    
    const player = game.players.get(socketId);
    const wasHost = player?.isHost || false;
    
    game.removePlayer(socketId);
    this.playerRooms.delete(socketId);
    
    // If room is empty, delete it
    if (game.players.size === 0) {
      this.games.delete(roomCode);
    }
    // If host left and there are still players, assign new host
    else if (wasHost) {
      const newHost = Array.from(game.players.values())[0];
      newHost.isHost = true;
    }
    
    return { roomCode, game, wasHost };
  }

  /**
   * Get all active games (for debugging/admin)
   * @returns {Array}
   */
  getActiveGames() {
    return Array.from(this.games.entries()).map(([code, game]) => ({
      roomCode: code,
      playerCount: game.players.size,
      status: game.status,
    }));
  }
}

module.exports = GameManager;

