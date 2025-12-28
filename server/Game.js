const { generateTiles } = require('./TileDistribution');
const WordValidator = require('./WordValidator');

/**
 * Game class represents a single game instance
 */
class Game {
  constructor(roomCode, reduceVowels = false) {
    this.roomCode = roomCode;
    this.reduceVowels = reduceVowels;
    this.status = 'waiting'; // waiting, playing, finished
    this.players = new Map(); // socketId -> player object
    this.tilePool = []; // Unflipped tiles
    this.flippedTiles = []; // Tiles on the table
    this.currentTurn = null; // socketId of current player
    this.turnOrder = []; // Array of socketIds
    this.wordValidator = new WordValidator();
    this.createdAt = Date.now();
  }

  /**
   * Add a player to the game
   * @param {string} socketId
   * @param {string} name
   * @param {boolean} isHost
   */
  addPlayer(socketId, name, isHost = false) {
    this.players.set(socketId, {
      id: socketId,
      name,
      isHost,
      words: [], // Array of claimed words
      score: 0, // Total number of tiles (letters) in all words
      joinedAt: Date.now(),
    });
  }

  /**
   * Remove a player from the game
   * @param {string} socketId
   */
  removePlayer(socketId) {
    this.players.delete(socketId);
    
    // Remove from turn order
    this.turnOrder = this.turnOrder.filter(id => id !== socketId);
    
    // If it was their turn, advance to next player
    if (this.currentTurn === socketId && this.turnOrder.length > 0) {
      this.advanceTurn();
    }
  }

  /**
   * Start the game
   */
  startGame() {
    if (this.status !== 'waiting') {
      throw new Error('Game already started');
    }
    
    if (this.players.size < 2) {
      throw new Error('Need at least 2 players');
    }

    this.status = 'playing';
    this.tilePool = generateTiles(this.reduceVowels);
    this.flippedTiles = [];
    
    // Set turn order
    this.turnOrder = Array.from(this.players.keys());
    this.currentTurn = this.turnOrder[0];
    
    console.log(`Game ${this.roomCode} started with ${this.tilePool.length} tiles`);
  }

  /**
   * Flip the next tile from the pool
   * @param {string} socketId - Player attempting to flip
   * @returns {Object} { success, tile?, error? }
   */
  flipTile(socketId) {
    if (this.status !== 'playing') {
      return { success: false, error: 'Game not in progress' };
    }

    if (this.currentTurn !== socketId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.tilePool.length === 0) {
      return { success: false, error: 'No tiles remaining' };
    }

    const tile = this.tilePool.pop();
    this.flippedTiles.push(tile);
    
    // Advance to next player's turn
    this.advanceTurn();

    return { success: true, tile };
  }

  /**
   * Advance to the next player's turn
   */
  advanceTurn() {
    const currentIndex = this.turnOrder.indexOf(this.currentTurn);
    const nextIndex = (currentIndex + 1) % this.turnOrder.length;
    this.currentTurn = this.turnOrder[nextIndex];
  }

  /**
   * Claim a word from available tiles
   * @param {string} socketId - Player claiming the word
   * @param {string} word - The word being claimed
   * @param {string[]} tiles - Array of tiles used (from flippedTiles)
   * @returns {Object} { success, error? }
   */
  claimWord(socketId, word, tiles) {
    if (this.status !== 'playing') {
      return { success: false, error: 'Game not in progress' };
    }

    const player = this.players.get(socketId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Validate word
    const normalizedWord = word.toUpperCase();
    const normalizedTiles = tiles.map(t => t.toUpperCase());

    // Check minimum length
    if (normalizedWord.length < 3) {
      return { success: false, error: 'Word must be at least 3 letters' };
    }

    // Check word is valid
    if (!this.wordValidator.isValidWord(normalizedWord)) {
      return { success: false, error: 'Not a valid word' };
    }

    // Check tiles spell the word
    if (!this.tilesSpellWord(normalizedTiles, normalizedWord)) {
      return { success: false, error: 'Tiles do not spell the word' };
    }

    // Check all tiles are available on the table
    if (!this.areTilesAvailable(normalizedTiles, this.flippedTiles)) {
      return { success: false, error: 'Some tiles are not available' };
    }

    // Check word is not a variation of existing word
    if (this.isWordVariation(normalizedWord)) {
      return { success: false, error: 'Cannot use variations of existing words' };
    }

    // Remove tiles from flipped pool
    this.removeTilesFromPool(normalizedTiles, this.flippedTiles);

    // Add word to player
    player.words.push(normalizedWord);
    player.score = player.words.reduce((sum, word) => sum + word.length, 0);

    return { success: true };
  }

  /**
   * Snatch words to create a new word
   * @param {string} snatcherId - Player doing the snatching
   * @param {string} targetPlayerId - Player being snatched from (can be self)
   * @param {string[]} oldWords - Words being taken
   * @param {string[]} tableTiles - Additional tiles from table
   * @param {string} newWord - New word being created
   * @returns {Object} { success, error? }
   */
  snatchWord(snatcherId, targetPlayerId, oldWords, tableTiles, newWord) {
    if (this.status !== 'playing') {
      return { success: false, error: 'Game not in progress' };
    }

    const snatcher = this.players.get(snatcherId);
    const target = this.players.get(targetPlayerId);
    
    if (!snatcher) {
      return { success: false, error: 'Snatcher not found' };
    }

    if (!target) {
      return { success: false, error: 'Target player not found' };
    }

    const normalizedNewWord = newWord.toUpperCase();
    const normalizedOldWords = oldWords.map(w => w.toUpperCase());
    const normalizedTableTiles = tableTiles.map(t => t.toUpperCase());

    // Validate new word
    if (normalizedNewWord.length < 3) {
      return { success: false, error: 'Word must be at least 3 letters' };
    }

    if (!this.wordValidator.isValidWord(normalizedNewWord)) {
      return { success: false, error: 'Not a valid word' };
    }

    // Check target has all the old words
    for (const oldWord of normalizedOldWords) {
      if (!target.words.includes(oldWord)) {
        return { success: false, error: `Target does not have word: ${oldWord}` };
      }
    }

    // Check table tiles are available
    if (!this.areTilesAvailable(normalizedTableTiles, this.flippedTiles)) {
      return { success: false, error: 'Some table tiles are not available' };
    }

    // Get all tiles from old words
    const allOldTiles = normalizedOldWords.join('').split('');
    const allUsedTiles = [...allOldTiles, ...normalizedTableTiles];

    // Check tiles spell the new word
    if (!this.tilesSpellWord(allUsedTiles, normalizedNewWord)) {
      return { success: false, error: 'Tiles do not spell the new word' };
    }

    // Check new word is not a variation of any old word
    for (const oldWord of normalizedOldWords) {
      if (this.areWordsSimilar(oldWord, normalizedNewWord)) {
        return { success: false, error: 'New word cannot be a variation of old word' };
      }
    }

    // Check new word is not a variation of other existing words
    if (this.isWordVariation(normalizedNewWord, normalizedOldWords)) {
      return { success: false, error: 'Cannot use variations of existing words' };
    }

    // Execute the snatch
    // Remove old words from target (this happens even if stealing from self)
    for (const oldWord of normalizedOldWords) {
      const index = target.words.indexOf(oldWord);
      if (index > -1) {
        target.words.splice(index, 1);
      }
    }
    target.score = target.words.reduce((sum, word) => sum + word.length, 0);

    // Remove table tiles from flipped pool
    this.removeTilesFromPool(normalizedTableTiles, this.flippedTiles);

    // Add new word to snatcher (only if different from target, otherwise already modified above)
    if (snatcherId !== targetPlayerId) {
      snatcher.words.push(normalizedNewWord);
      snatcher.score = snatcher.words.reduce((sum, word) => sum + word.length, 0);
    } else {
      // Stealing from self - word already removed above, just add the new one
      target.words.push(normalizedNewWord);
      target.score = target.words.reduce((sum, word) => sum + word.length, 0);
    }

    return { success: true };
  }

  /**
   * Check if tiles spell a word correctly
   * @param {string[]} tiles
   * @param {string} word
   * @returns {boolean}
   */
  tilesSpellWord(tiles, word) {
    const tilesCopy = [...tiles];
    const wordLetters = word.split('');

    for (const letter of wordLetters) {
      const index = tilesCopy.indexOf(letter);
      if (index === -1) {
        return false;
      }
      tilesCopy.splice(index, 1);
    }

    // All tiles must be used
    return tilesCopy.length === 0;
  }

  /**
   * Check if tiles are available in a pool
   * @param {string[]} tiles - Tiles to check
   * @param {string[]} pool - Pool to check against
   * @returns {boolean}
   */
  areTilesAvailable(tiles, pool) {
    const poolCopy = [...pool];
    
    for (const tile of tiles) {
      const index = poolCopy.indexOf(tile);
      if (index === -1) {
        return false;
      }
      poolCopy.splice(index, 1);
    }
    
    return true;
  }

  /**
   * Remove tiles from a pool
   * @param {string[]} tiles
   * @param {string[]} pool
   */
  removeTilesFromPool(tiles, pool) {
    for (const tile of tiles) {
      const index = pool.indexOf(tile);
      if (index > -1) {
        pool.splice(index, 1);
      }
    }
  }

  /**
   * Check if a word is a variation of any existing word in play
   * @param {string} word
   * @param {string[]} exclude - Words to exclude from check
   * @returns {boolean}
   */
  isWordVariation(word, exclude = []) {
    for (const player of this.players.values()) {
      for (const existingWord of player.words) {
        if (!exclude.includes(existingWord) && this.areWordsSimilar(word, existingWord)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if two words are similar (one is a variation of the other)
   * @param {string} word1
   * @param {string} word2
   * @returns {boolean}
   */
  areWordsSimilar(word1, word2) {
    // Same word
    if (word1 === word2) return true;

    // Common suffixes that make variations
    const suffixes = ['S', 'ED', 'ING', 'ER', 'EST', 'LY', 'Y'];
    
    // Check if word1 is word2 + suffix
    for (const suffix of suffixes) {
      if (word1 === word2 + suffix || word2 === word1 + suffix) {
        return true;
      }
    }

    // Check if one is the base of the other (e.g., TONE vs TONED)
    const shorter = word1.length < word2.length ? word1 : word2;
    const longer = word1.length < word2.length ? word2 : word1;
    
    if (longer.startsWith(shorter) && longer.length - shorter.length <= 3) {
      // Likely a variation
      return true;
    }

    return false;
  }

  /**
   * End the game
   */
  endGame() {
    this.status = 'finished';
  }

  /**
   * Get final scores
   * @returns {Array}
   */
  getFinalScores() {
    return Array.from(this.players.values())
      .map(player => ({
        id: player.id,
        name: player.name,
        score: player.score,
        words: player.words,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get current game state
   * @returns {Object}
   */
  getState() {
    return {
      roomCode: this.roomCode,
      status: this.status,
      players: Array.from(this.players.values()),
      flippedTiles: this.flippedTiles,
      tilesRemaining: this.tilePool.length,
      currentTurn: this.currentTurn,
      turnOrder: this.turnOrder,
    };
  }
}

module.exports = Game;

