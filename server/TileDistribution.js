// Bananagrams tile distribution (144 tiles total)
const STANDARD_DISTRIBUTION = {
  A: 13,
  B: 3,
  C: 3,
  D: 6,
  E: 18,
  F: 3,
  G: 4,
  H: 3,
  I: 12,
  J: 2,
  K: 2,
  L: 5,
  M: 3,
  N: 8,
  O: 11,
  P: 3,
  Q: 2,
  R: 9,
  S: 6,
  T: 9,
  U: 6,
  V: 3,
  W: 3,
  X: 2,
  Y: 3,
  Z: 2,
};

// Reduced vowel distribution (removes ~12 vowels for better Snatch gameplay)
const REDUCED_VOWEL_DISTRIBUTION = {
  A: 10,  // -3
  B: 3,
  C: 3,
  D: 6,
  E: 15,  // -3
  F: 3,
  G: 4,
  H: 3,
  I: 10,  // -2
  J: 2,
  K: 2,
  L: 5,
  M: 3,
  N: 8,
  O: 9,   // -2
  P: 3,
  Q: 2,
  R: 9,
  S: 6,
  T: 9,
  U: 4,   // -2
  V: 3,
  W: 3,
  X: 2,
  Y: 3,
  Z: 2,
};

/**
 * Generate a shuffled array of tiles based on the distribution
 * @param {boolean} reduceVowels - Whether to use reduced vowel distribution
 * @returns {string[]} Array of letter tiles
 */
function generateTiles(reduceVowels = false) {
  const distribution = reduceVowels ? REDUCED_VOWEL_DISTRIBUTION : STANDARD_DISTRIBUTION;
  const tiles = [];

  for (const [letter, count] of Object.entries(distribution)) {
    for (let i = 0; i < count; i++) {
      tiles.push(letter);
    }
  }

  // Shuffle using Fisher-Yates algorithm
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  return tiles;
}

/**
 * Get the total number of tiles in a distribution
 * @param {boolean} reduceVowels - Whether to use reduced vowel distribution
 * @returns {number} Total tile count
 */
function getTileCount(reduceVowels = false) {
  const distribution = reduceVowels ? REDUCED_VOWEL_DISTRIBUTION : STANDARD_DISTRIBUTION;
  return Object.values(distribution).reduce((sum, count) => sum + count, 0);
}

module.exports = {
  STANDARD_DISTRIBUTION,
  REDUCED_VOWEL_DISTRIBUTION,
  generateTiles,
  getTileCount,
};

