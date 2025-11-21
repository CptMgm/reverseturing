# Reverse Turing Test

A multiplayer social deduction game where 1 human must convince 3 AI characters that they are human, while the AIs try to prove they themselves are human.

## 🎮 Game Concept

You're in a voice/text call with 3 AI characters. A mysterious "President" announces that reality is a simulation that's collapsing. Only one real human can escape - but the AIs believe they're human too. Through debate and voting, the group must identify the real human.

**The twist**: You ARE the human, but the AIs don't know that. Can you convince them you're real while they try to prove they're not bots?

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env:
# - GEMINI_API_KEY (Google Gemini API)
# - ELEVENLABS_API_KEY (ElevenLabs TTS)

# Start backend server
npm run server

# In another terminal, start frontend
npm run dev
```

Visit `http://localhost:5173` to play!

## 🎯 Features

### Core Gameplay
- **Voice or Text Mode**: Choose your communication method
- **3 AI Characters**: Each with distinct personalities
  - **Wario Amadeuss**: Paranoid and dramatic
  - **Domis Hassoiboi**: Arrogant and intellectual
  - **Scan Ctrl+Altman**: Gen-Z, casual, uses slang
- **Secret Moderator**: First AI to speak becomes the hidden conversation leader
- **Turn-Based Debate**: Smart turn management with direct question detection
- **Voting System**: Reach consensus to call the President back

### Advanced Features
- **Message Dismissal**: Prevents simultaneous responses (saves API credits)
- **Text Mode Suspicion**: AIs immediately suspect you if you can't speak
- **User Turn Forcing**: Get called out if you stay silent when asked
- **Typing Detection**: Deadline extends while you're typing
- **Phone Call Effect**: All AI voices have telephone-quality audio processing
- **Conversation History**: Full transcript saved to file

### Technical Features
- **Comprehensive Logging**: All API calls logged to files
  - `api-logs.jsonl` - Structured JSON logs with credit estimates
  - `conversation-log.txt` - Human-readable conversation transcript
- **Smart Context Management**: 8-message rolling window + per-AI history
- **WebSocket Communication**: Real-time bidirectional updates
- **Web Audio API**: Phone effect applied to all AI voices

## 📋 Architecture

### Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + WebSocket
- **AI**: Google Gemini API (gemini-2.0-flash)
- **Voice**: ElevenLabs TTS (eleven_monolingual_v1)
- **Video**: Daily.co (optional, can be removed)

### Key Components

```
src/
├── components/
│   ├── GameRoom.jsx          # Main game UI
│   ├── VideoGrid.jsx          # Player video tiles
│   ├── VoteControls.jsx       # Voting interface
│   ├── PresidentOverlay.jsx   # President intro screen
│   └── ModeSelectionModal.jsx # Voice/text mode choice
├── contexts/
│   └── GameContext.jsx        # Global game state + WebSocket
├── services/
│   ├── moderatorController.js # Core game logic & state machine
│   ├── geminiLiveService.js   # Gemini API integration
│   └── gameOrchestrator.js    # Game flow coordination
└── utils/
    └── reverseGamePersonas.js # AI character definitions

server.js                      # Backend WebSocket server + API
```

### Game Phases

1. **LOBBY** - Waiting for player to start
2. **CALL_CONNECTING** - Players joining call
3. **PRESIDENT_INTRO** - President delivers opening speech
4. **SELF_ORGANIZATION** - First AI becomes Secret Moderator
5. **FREE_DEBATE** - Main gameplay (debate + questioning)
6. **VOTING** - Players vote on who is human
7. **PRESIDENT_VERDICT** - President returns with judgment

## 🔧 Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional
PORT=3001
DAILY_API_KEY=your_daily_api_key_here  # (can be removed)
```

### AI Voice IDs (ElevenLabs)

Configured in `server.js`:
```javascript
const voiceMap = {
  'moderator': 'nPczCjzI2devNBz1zQrb',  // President (Brian)
  'player2': 'JBFqnCBsd6RMkjVDRZzb',    // Wario (George)
  'player3': 'pqHfZKP75CvOlQylNhV4',    // Domis (Bill)
  'player4': 'N2lVS1w4EtoT3dr4eOWO',    // Scan (Callum)
};
```

## 💰 Cost Estimates

### Per Game (~10 minutes)
- **Gemini API**: ~25 calls (FREE)
- **ElevenLabs TTS**: ~25 calls × 250 credits = **~6,250 credits**

### With ElevenLabs Creator Plan ($11/month)
- **330,000 credits/month** = ~53 games/month

### Optimization Tips
- Already using `eleven_monolingual_v1` (35% cheaper than turbo)
- Message dismissal reduces API calls by ~17%
- Shorten AI responses to reduce character count

## 🎨 UI Features

### Google Meet Style Layout
- **Video Grid**: Left side, shows all participants
- **Chat Sidebar**: Right side, collapsible (320px → 48px)
- **Voting Panel**: Appears only during voting phase
- **Mode Selection**: Beautiful modal for voice/text choice

### Visual Indicators
- **Active Speaker**: Highlighted border around speaking player
- **Connection Status**: Shows which players are connected
- **System Errors**: Animated error messages
- **Phase Display**: Current game phase in header

## 📚 Documentation

- **`CURRENT_IMPLEMENTATION_EXPLAINED.md`** - Complete technical deep-dive
  - API architecture explanation
  - Message queuing system
  - Voice input status (not yet connected)
  - Context management details

- **`FINAL_IMPLEMENTATION_SUMMARY.md`** - Latest improvements
  - Message dismissal implementation
  - Text mode AI suspicion
  - User turn forcing
  - Comprehensive logging

## 🐛 Known Issues / TODOs

### High Priority
- [ ] **Voice Input Not Connected** - Components exist but unused
- [ ] **Display Conversation History** - Show messages in chat sidebar
- [ ] **Turn Indicator Visual** - Green border when it's your turn

### Medium Priority
- [ ] **Complete Gemini Logging** - Add error logging
- [ ] **Dynamic Timeout** - Adjust based on question complexity
- [ ] **Credit Monitor** - Show remaining ElevenLabs credits in UI

### Low Priority
- [ ] **Remove Daily.co** - Unused video infrastructure (can simplify)
- [ ] **Replay System** - Load conversation-log.txt to watch replays
- [ ] **Analytics Dashboard** - Visualize api-logs.jsonl data

## 🧪 Testing

### Manual Test Checklist
- [ ] Start game with custom name
- [ ] Select text mode → AI comments suspiciously
- [ ] Get asked a question → Stay silent → AI comments
- [ ] Type while waiting → Deadline extends
- [ ] Multiple AIs respond → Only first plays (check console)
- [ ] Check `api-logs.jsonl` after game
- [ ] Check `conversation-log.txt` after game

### Console Logs to Watch For

**Message Dismissal**:
```
❌ [ModeratorController] Dismissing simultaneous response from player3
   Time since last response: 1432ms (< 2000ms)
```

**Text Mode Detection**:
```
🎙️ [Server] User selected communication mode: text
📝 [ModeratorController] Text mode detected, triggering AI suspicion
```

**User Turn Forcing**:
```
⏰ [ModeratorController] Waiting for user response (10s timeout)
⌨️ [ModeratorController] User is typing... extending deadline
⚠️ [ModeratorController] User didn't respond in 10 seconds
```

## 🤝 Contributing

This is a personal project, but feel free to fork and experiment!

## 📝 License

MIT License - See LICENSE file for details

## 🎮 Credits

- **Concept**: Reverse Turing Test social deduction game
- **AI**: Google Gemini (gemini-2.0-flash)
- **Voice**: ElevenLabs (eleven_monolingual_v1)
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + WebSocket

---

**Enjoy the game!** 🎭🤖🎮
