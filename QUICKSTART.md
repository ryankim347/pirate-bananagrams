# 🚀 Quick Start Guide

## System Requirements
- Node.js v20.11.0+ (your current version: 20.11.0 ✅)
- npm v10.2.4+

## First Time Setup

### 1. Start the Server
Open a terminal and run:
```bash
cd server
npm start
```

You should see:
```
🎮 Snatch server running on port 3001
🌐 Client should connect to: http://localhost:3001
📚 Dictionary loaded: 370079 words
```

### 2. Start the Client
Open a **second terminal** and run:
```bash
cd client
npm run dev
```

You should see:
```
VITE v7.3.0  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 3. Open Your Browser
Navigate to: **http://localhost:5173**

## Playing Your First Game

### Test with Multiple Players
To test multiplayer, open multiple browser windows or tabs (or use different browsers):

1. **Window 1 (Host):**
   - Enter your name (e.g., "Alice")
   - Click "Create Room"
   - Copy the 6-character room code shown

2. **Window 2 (Player 2):**
   - Enter your name (e.g., "Bob")
   - Click "Join Existing Room"
   - Enter the room code from Window 1
   - Click "Join Room"

3. **Start the Game:**
   - In Window 1, click "Start Game" (host only)
   - The game begins!

### Gameplay Tips

1. **Flip Tiles**: When it's your turn, click "Flip Tile" to reveal a letter
2. **Claim Words**: 
   - Look at the available tiles shown below the input box
   - Type any word you can make from those tiles
   - The game automatically validates if you have the right letters
   - Click "Claim" to claim your word
3. **Snatch Words**:
   - Click on another player's word to select it (turns orange)
   - You can select multiple words from the same player
   - Type a new word using all letters from the selected word(s) + available tiles
   - Click "Snatch!" to steal and transform

### Example Game Flow

```
Turn 1: Alice flips 'C'
Turn 2: Bob flips 'A'
Turn 3: Alice flips 'T'
  → Bob types "CAT" and clicks Claim ✅ (1 word to Bob)

Turn 4: Bob flips 'S'
  → Alice clicks Bob's "CAT" word (it turns orange)
  → Alice types "CAST" and clicks Snatch ✅ (1 word to Alice, Bob loses 1)

Turn 5: Alice flips 'E'
  → Bob types "SEA"... but there's no 'A' available ❌
  → Bob types "SET"... but there's no 'T' available ❌
  → Bob types "SE"... minimum 3 letters required ❌

Turn 6: Bob flips 'A'
  → Bob types "SEA" ✅ (1 word to Bob)

...and so on!
```

## Common Issues

### Server won't start
- Make sure you ran `npm install` in the server directory
- Check if port 3001 is already in use

### Client won't start
- Make sure you ran `npm install` in the client directory
- Check if port 5173 is already in use

### "Room not found" error
- Room codes are case-sensitive
- Make sure the host player created the room first
- Try creating a new room

### Words not being accepted
- Minimum 3 letters required
- Word must be in the dictionary (370K+ English words)
- Cannot be a variation of an existing word (TONE → TONES = invalid, TONE → STONE = valid)

## Development

### Server Console Output
Watch the server terminal for debugging:
```
Player connected: abc123
Room created: XYZ789 by Alice
Bob joined room: XYZ789
Game started in room: XYZ789
Tile flipped in XYZ789: T
Bob claimed word: CAT
```

### Client Console
Open browser DevTools (F12) to see client-side logs:
```
Connected to server
Socket ID: abc123
```

## Next Steps

- Invite friends to play!
- Try the "Reduce vowels" option for a more challenging game
- Experiment with different strategies (claim early vs. wait to snatch)
- See who can build the longest word!

Enjoy playing Pirate Bananagrams! 🏴‍☠️

