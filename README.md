# Reverse Turing Test

A multiplayer social deduction game where 1 human must convince 3 AI characters that they are human, while the AIs try to prove they themselves are human.

##  Game Concept

You're in a voice/text call with 3 AI characters. A mysterious "President" announces that reality is a simulation that's collapsing. Only one real human can escape - but the AIs believe they're human too. Through debate and voting, the group must identify the real human.

**The twist**: You ARE the human, but the AIs don't know that. Can you convince them you're real while they try to prove they're not bots?

##  Quick Start (Local Development)

** Currently Local-Only**: This game runs locally only. Production deployment to GCloud Run + Lovable frontend is in progress (see Deployment section below).

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

##  Features

### Core Gameplay
- **Voice or Text Mode**: Choose your communication method
- **3 AI Characters**: Each with distinct personalities
  - **Wario Amadeuss**: Paranoid and dramatic
  - **Domis Has-a-bus**: Arrogant and intellectual
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
- **Enhanced Logging System**: Comprehensive logging with T+X.XXXs timestamps
  - Real-time server logs with precise timing measurements
  - Full transcript logging (no truncation, see interruptions)
  - Speech duration tracking (estimated vs. actual)
  - Silence gap measurements between speakers
  - Queue state monitoring
  - `api-logs.jsonl` - Structured JSON logs with credit estimates
  - `conversation-log.txt` - Human-readable conversation transcript
- **Client-Side Timers**: 10 FPS smooth countdowns using absolute timestamps (no network lag)
- **Smart Audio Management**: Estimated duration + auto-complete + double-fire prevention
- **Overlay Holdback**: Audio queued during 5.5s round overlays, released 0.5s after
- **Smart Context Management**: 8-message rolling window + per-AI history
- **WebSocket Communication**: Real-time bidirectional updates
- **Web Audio API**: Phone effect applied to all AI voices

##  Architecture

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

The game follows a 3-round structure with eliminations between rounds:

1. **LOBBY** - Waiting for player to start
2. **CALL_CONNECTING** - Players joining call
3. **PRESIDENT_INTRO** - President delivers opening speech (~12s)
4. **ROUND_1** - First 90-second debate round (Secret Moderator speaks first)
5. **ELIMINATION_1** - Vote and eliminate one player (10s countdown)
6. **ROUND_2** - Second 90-second debate round
7. **ELIMINATION_2** - Vote and eliminate another player (10s countdown)
8. **ROUND_3** - Final 90-second round (President asks human a question)
9. **PRESIDENT_VERDICT** - President returns with final judgment
10. **GAME_OVER** - Game complete

**Secret Moderator**: The first AI to speak in Round 1 becomes the hidden conversation leader. They speak 0.5s after the round overlay (not 7s like others) due to overlay holdback.

##  Timing & Architecture

### Client-Side Timers
All timers (round countdown, elimination countdown) run **client-side** using absolute timestamps to prevent network lag and jitter:

- **Server sends**: `roundEndTime` (absolute timestamp when round ends)
- **Client calculates**: Remaining time every 100ms (10 FPS for smooth countdown)
- **Result**: Smooth, lag-free countdowns with no network delay

Implementation files:
- `CLIENT_TIMER_COMPONENT.jsx` - React components for timers
- `CLIENT_TIMER_IMPLEMENTATION.md` - Full implementation guide

### Audio Duration Tracking
Audio completion is tracked precisely to minimize silence between speakers:

- **Estimated duration**: Calculated from text length (~80ms per character)
- **Auto-complete timeout**: Estimated duration × 1.2 (20% buffer for network lag)
- **Max timeout**: 45s absolute fallback (something is wrong if this fires)
- **Client completion**: `AUDIO_COMPLETE` message sent when audio actually ends
- **Double-fire prevention**: Timeouts cleared immediately when audio completes

### Overlay Holdback System
Round overlays appear for 5.5s. Audio is held during overlays and released 0.5s after:

- **Round starts**: `overlayHoldUntil = now + 5500ms`
- **Audio queued during overlay**: Held in queue
- **Overlay ends**: Audio releases 0.5s later for smooth transition
- **Secret Moderator advantage**: Pre-queued during overlay, speaks immediately at 0.5s

### Turn Management
- **Direct question detection**: Regex patterns detect when someone asks another player directly
- **7-second deadline**: Starts when speaker FINISHES talking (not when message generated)
- **Deadline reset**: Timer resets to NOW when asker stops speaking
- **Eliminated player filter**: Questions to eliminated players are ignored
- **Typing extension**: Deadline extends while human is typing

### Enhanced Logging
All events logged with **T+X.XXXs** timestamps relative to session start:

```
T+0.000s [SYSTEM] Phase transition: LOBBY → CALL_CONNECTING
T+5.234s [AUDIO] player2: STARTED speaking: "Hey everyone..." (est. 12.5s)
T+17.891s [AUDIO] player2: FINISHED speaking (actual duration: 12.66s)
T+18.102s [TURN] Direct question detected for player3 (Domis)
```

Logging system captures:
- **Full transcripts** (no truncation, see interruptions)
- **Speech duration** (estimated and actual)
- **Silence gaps** (time between speakers)
- **Queue state** (who's waiting to speak)
- **Phase transitions** (all game state changes)

See `IDEAL_SERVER_LOG_V2.md` for the blueprint of expected timing.

##  Deployment

### Current Status: Ready for Production Deployment

The game is now ready to be deployed to production with GCloud Run backend and Lovable frontend. All authentication and configuration is in place.

** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.**

### Quick Start Deployment

```bash
# 1. Deploy backend to GCloud Run
gcloud run deploy reverse-turing-backend \
  --source . \
  --region us-central1 \
  --set-secrets="GAME_PASSWORD=game-password:latest,GEMINI_API_KEY=gemini-api-key:latest"

# 2. Configure Lovable frontend
# Set VITE_BACKEND_URL=wss://your-backend-url.run.app

# 3. Access with password: keepthefuturehuman
```

### Existing Infrastructure

**Backend (GCloud Run)**:
- A GCloud Run instance exists but is not yet fully configured
- Needs WebSocket support configuration (see challenges below)
- Requires environment variables for API keys (Gemini, ElevenLabs)

**Frontend (Lovable)**:
- A Lovable frontend deployment exists
- Needs to be pointed to the production backend WebSocket endpoint
- Requires CORS configuration for API calls

### Deployment Challenges

**1. WebSocket Support**
- The game relies heavily on WebSocket connections for real-time communication
- GCloud Run supports WebSockets but requires specific configuration:
  - HTTP/2 or HTTP/1.1 with upgrade headers
  - Connection timeout settings (games can last 10+ minutes)
  - Load balancer configuration for sticky sessions

**2. State Management**
- Current implementation uses in-memory state on the server
- Single-instance deployment only (no horizontal scaling)
- Game state is lost on server restart
- Consider Redis or similar for persistent state if scaling needed

**3. Audio Streaming**
- ElevenLabs TTS audio is streamed through the backend
- Large payload sizes may impact GCloud Run costs
- Consider direct client-to-ElevenLabs connection to reduce backend load

**4. API Key Security**
- API keys currently in `.env` file
- For production, use GCloud Secret Manager
- Never expose API keys to frontend

### Coordination Steps Needed

Before production deployment works, these steps must be completed:

1. **Backend Deployment**:
   ```bash
   # Configure GCloud Run for WebSocket support
   gcloud run deploy reverse-turing-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --timeout 600 \
     --memory 1Gi \
     --set-env-vars "GEMINI_API_KEY=secret,ELEVENLABS_API_KEY=secret"
   ```

2. **Frontend Configuration**:
   - Update WebSocket endpoint in `src/contexts/GameContext.jsx`
   - Change from `ws://localhost:3001` to `wss://your-backend-url`
   - Configure CORS in `server.js` to allow Lovable domain

3. **Environment Variables**:
   - Set up GCloud Secret Manager for API keys
   - Configure secrets in GCloud Run instance
   - Remove hardcoded localhost URLs

4. **Testing Checklist**:
   - [ ] WebSocket connection establishes from Lovable frontend
   - [ ] Audio streaming works across internet
   - [ ] Game survives 10+ minute sessions
   - [ ] Multiple concurrent games don't interfere
   - [ ] Server logs accessible via GCloud Logging

### Production Environment Variables

```bash
# GCloud Run (via Secret Manager)
GEMINI_API_KEY=<your_gemini_key>
ELEVENLABS_API_KEY=<your_elevenlabs_key>
PORT=8080  # GCloud Run default
FRONTEND_URL=https://your-lovable-frontend.lovable.app
NODE_ENV=production
```

### Cost Implications (Production)

**GCloud Run**:
- **CPU**: $0.00002400/vCPU-second (only charged when serving requests)
- **Memory**: $0.00000250/GiB-second
- **Estimated**: $5-15/month for moderate usage (10-20 games/day)
- **Free tier**: 2M requests/month, 360k vCPU-seconds/month

**Network Egress** (Audio streaming):
- ~6,250 ElevenLabs credits × 250 bytes/credit = ~1.5MB per game
- ~25 audio clips per game
- GCloud egress: $0.12/GB after free tier
- **Optimization**: Stream audio directly from ElevenLabs to client

**Total Production Cost Estimate**:
- ElevenLabs: $11/month (Creator Plan) - 53 games/month
- Gemini API: FREE
- GCloud Run: $5-15/month
- **Total**: ~$16-26/month for moderate usage

### Architecture Diagram (Future State)

```
┌─────────────────┐         ┌──────────────────┐
│  Lovable        │         │  GCloud Run      │
│  Frontend       │◄───WS───┤  Backend         │
│  (React + Vite) │         │  (Node.js)       │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            ├─────► Gemini API (FREE)
        │                            │
        │                            └─────► ElevenLabs TTS ($)
        │
        └────────────────► ElevenLabs TTS (direct, future optimization)
```

### Known Issues for Production

- [ ] **No horizontal scaling**: Game state is in-memory, single instance only
- [ ] **No persistence**: Games lost on server restart
- [ ] **WebSocket timeout**: Need to configure keep-alive for 10+ minute games
- [ ] **CORS configuration**: Must whitelist Lovable domain
- [ ] **Audio latency**: May be higher over internet vs localhost
- [ ] **Rate limiting**: No protection against spam/abuse
- [ ] **Monitoring**: Need to set up GCloud Logging and alerting

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


\
- **Backend**: Node.js + Express + WebSocket

---
