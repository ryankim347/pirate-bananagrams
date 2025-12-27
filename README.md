# 🏴‍☠️ Pirate Bananagrams

A real-time multiplayer word game where players compete to claim and snatch words from tiles and each other!

## About the Game

Pirate Bananagrams (also known as "Snatch") is a fast-paced word game played with Bananagrams-style letter tiles. Players take turns flipping tiles and can claim words at any time during the game. The exciting twist? You can "snatch" other players' words by combining them with additional tiles to create new words!

### Game Rules

1. **Tile Flipping**: Players take turns flipping tiles from the pool into a shared play area
2. **Claiming Words**: 
   - Any player can claim a word at any time (minimum 3 letters)
   - Select available tiles from the table to spell a word
3. **Snatching**:
   - Take one or more words from any player (including yourself)
   - Add tiles from the table to create a new, longer word
   - The new word must have a different meaning (no simple variations like TONE → TONES)
4. **Winning**: When all tiles are flipped and no more moves can be made, the player with the most tiles (letters) wins!

## Features

- 🎮 Real-time multiplayer gameplay using WebSockets
- 🎯 Room-based game sessions with unique codes
- 📚 Dictionary validation with 370,000+ words
- 🎨 Beautiful, modern UI with animations
- 🔤 Standard or reduced vowel tile distributions
- 👥 Support for 2-8 players per game
- 🏆 Live score tracking

## Tech Stack

### Backend
- Node.js + Express
- Socket.io for real-time communication
- In-memory game state management

### Frontend
- React with Vite
- Socket.io-client
- CSS Modules for styling

## Getting Started

### Prerequisites
- Node.js v20.11.0 or higher (compatible with Vite 5.x)
- npm v10.2.4 or higher

**Note:** This project uses Vite 5.x which is compatible with Node.js 20.11.0. If you upgrade to Node.js 20.19+ or 22.12+, you can optionally upgrade to Vite 7.x for better performance.

### Installation

1. **Clone the repository**
```bash
cd piratebananagrams
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

### Running the Application

1. **Start the server** (in one terminal)
```bash
cd server
npm start
```
The server will run on `http://localhost:3001`

2. **Start the client** (in another terminal)
```bash
cd client
npm run dev
```
The client will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## How to Play

1. **Create or Join a Room**
   - Enter your name
   - Create a new room or join with a 6-character room code
   - Optionally enable "Reduce vowels" for a more challenging game

2. **Wait for Players**
   - Share the room code with friends
   - Host starts the game when everyone is ready (minimum 2 players)

3. **Play the Game**
   - **Your Turn**: Click "Flip Tile" to reveal a new letter
   - **Claim Words**: 
     - Simply type a word in the input box
     - The game automatically checks if the word can be spelled with available tiles
     - Click "Claim" to claim the word
   - **Snatch Words**:
     - Click words from other players to select them (they turn orange)
     - Type a new word that uses those letters + optionally table tiles
     - Click "Snatch!" to steal and transform the words

4. **Win!**
   - The game ends when all tiles are flipped and no more moves are possible
   - The player with the most words wins!

## Project Structure

```
piratebananagrams/
├── server/
│   ├── index.js                 # Express + Socket.io server
│   ├── GameManager.js           # Manages multiple game rooms
│   ├── Game.js                  # Core game logic
│   ├── TileDistribution.js      # Tile set configurations
│   ├── WordValidator.js         # Dictionary validation
│   ├── words.txt                # English word dictionary (370K+ words)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby.jsx        # Room creation/joining
│   │   │   ├── Game.jsx         # Main game board
│   │   │   ├── TilePool.jsx     # Tile flipping interface
│   │   │   ├── FlippedTiles.jsx # Available tiles display
│   │   │   ├── PlayerWords.jsx  # Player word lists
│   │   │   └── ClaimWordModal.jsx # Word input modal
│   │   ├── hooks/
│   │   │   └── useSocket.js     # Socket.io connection
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Game Configuration

### Tile Distribution

**Standard Distribution** (144 tiles):
- Vowels: A(13), E(18), I(12), O(11), U(6)
- Common consonants: T(9), R(9), N(8), S(6), L(5)
- Less common: Q(2), X(2), Z(2)

**Reduced Vowels** (132 tiles):
- Removes 12 vowels for a more challenging Snatch experience
- Better balance for competitive play

## Development

### Backend Endpoints

**HTTP:**
- `GET /health` - Server health check and active games list

**Socket.io Events:**

*Client → Server:*
- `createRoom({ playerName, reduceVowels })`
- `joinRoom({ roomCode, playerName })`
- `startGame()`
- `flipTile()`
- `claimWord({ word, tiles })`
- `snatchWord({ targetPlayerId, oldWords, tableTiles, newWord })`
- `endGame()`

*Server → Client:*
- `roomCreated({ roomCode, playerId, gameState })`
- `playerJoined({ player })`
- `playerLeft({ playerId, wasHost, newHost })`
- `gameStarted({ gameState })`
- `tileFlipped({ tile, flippedTiles, tilesRemaining, currentTurn })`
- `wordClaimed({ playerId, playerName, word, tiles, flippedTiles })`
- `wordSnatched({ snatcherId, snatcherName, targetId, oldWords, newWord, flippedTiles })`
- `gameEnded({ finalScores })`

## Future Enhancements

- [ ] Persistent game rooms with Redis
- [ ] Game replay and history
- [ ] Custom tile distributions
- [ ] In-game chat
- [ ] Sound effects and music
- [ ] Mobile-responsive design improvements
- [ ] Spectator mode
- [ ] Timer modes (speed rounds)
- [ ] Tournament brackets

## Credits

Game concept based on the classic word game "Snatch" (also known as "Grab" or "Anagrab"), which predates Scrabble and has existed since the Victorian era.

## License

MIT License - Feel free to use this project for learning and fun!

