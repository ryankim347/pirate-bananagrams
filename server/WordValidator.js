const fs = require('fs');
const path = require('path');

/**
 * WordValidator validates words against a dictionary
 */
class WordValidator {
  constructor() {
    this.words = new Set();
    this.loadDictionary();
  }

  /**
   * Load the dictionary file into memory
   */
  loadDictionary() {
    try {
      const dictionaryPath = path.join(__dirname, 'words.txt');
      const content = fs.readFileSync(dictionaryPath, 'utf-8');
      const wordList = content.split('\n').map(word => word.trim().toUpperCase()).filter(word => word.length >= 3);
      
      this.words = new Set(wordList);
      console.log(`📚 Dictionary loaded: ${this.words.size} words`);
    } catch (error) {
      console.error('Error loading dictionary:', error);
      // Fallback to a small set of common words for testing
      this.words = new Set([
        'CAT', 'DOG', 'TONE', 'STONE', 'TONES', 'TONED', 'WORD', 'GAME',
        'PLAY', 'TILE', 'SNATCH', 'CLAIM', 'TABLE', 'POOL', 'FLIP'
      ]);
      console.warn('⚠️  Using fallback dictionary with limited words');
    }
  }

  /**
   * Check if a word is valid
   * @param {string} word - Word to validate (will be converted to uppercase)
   * @returns {boolean}
   */
  isValidWord(word) {
    const normalized = word.toUpperCase().trim();
    return this.words.has(normalized);
  }

  /**
   * Get the number of words in the dictionary
   * @returns {number}
   */
  getWordCount() {
    return this.words.size;
  }

  /**
   * Check if multiple words are valid
   * @param {string[]} words
   * @returns {Object} { valid: string[], invalid: string[] }
   */
  validateMultiple(words) {
    const valid = [];
    const invalid = [];
    
    for (const word of words) {
      if (this.isValidWord(word)) {
        valid.push(word.toUpperCase());
      } else {
        invalid.push(word.toUpperCase());
      }
    }
    
    return { valid, invalid };
  }
}

module.exports = WordValidator;

