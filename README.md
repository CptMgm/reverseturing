# Reverse Turing Test

A social deduction game where you must prove you're human to escape a simulation filled with AI players.

## Setup

1. Copy `.env.example` to `.env` and add your API keys:
   - OPENAI_API_KEY (optional)
   - ANTHROPIC_API_KEY
   - GOOGLE_API_KEY
   - xAI_API_KEY
   - ELEVENLABS_API_KEY
   - SUPABASE_API_KEY

2. Install dependencies:
```bash
npm install
```

3. Run the game:
```bash
npm start
```

This repo uses SUPABASE (no backend required - API calls are proxied through Express server on port 3001).

## How to Play

1. **Name Entry**: Enter your name to become the human player
2. **Introduction**: Read three intro screens explaining the premise
3. **Player Selection**: Review all AI characters and their personalities, enable audio & microphone
4. **Gameplay**: Participate in 1-3 Q&A rounds trying to convince others you're human
5. **Voting**: Everyone votes on who they think is human (can't vote for yourself)
6. **Result**: Win if you receive the most votes and escape the simulation!

## Game Flow & Logic

### Players (4 Total)
- **1 Human Player** (You) - Position 2 in turn order
- **3 Active AI Players** - Powered by Google Gemini 2.5 Flash:
  - **Wario Amadeuss** (Position 1) - AI safety philosopher worried about alignment
  - **Domis Hassoiboi** (Position 3) - Chess grandmaster obsessed with patterns
  - **Scan Ctrl+Altman** (Position 4) - AGI accelerationist and scaling enthusiast
- **AI Moderator: Dorkesh Cartel** - Formal, methodical host who manages game flow

**Note**: Elongated Muskett (xAI character) is currently disabled.

### Turn Order
All phases follow the same sequence: **Player 1 (AI) → You (Human) → Player 3 (AI) → Player 4 (AI)**

### Game Phases

#### Phase 1: Introduction
- Moderator welcomes players and explains the game rules
- Sets the stakes: winner escapes, losers stay in simulation forever

#### Phase 2: Q&A Rounds (1-3 rounds)
**Initial Question (Round 1)**:
"Describe a moment when you felt truly human. What made that experience so meaningful to you?"

**Additional Questions (Rounds 2-3, randomly selected)**:
- "What's something you've done that you're genuinely proud of?"
- "Describe a time when you felt completely misunderstood. What happened?"
- "Tell me about a moment that changed how you see the world."
- "What's the most irrational fear you have, and why do you think you have it?"
- "Describe a decision you made that you still question today."

**Round Flow**:
1. Moderator asks the first player
2. Player 1 (AI) answers → Moderator transitions
3. You (Human) answer → Moderator transitions
4. Player 3 (AI) answers → Moderator transitions
5. Player 4 (AI) answers
6. All answered → Interlude screen appears

**Interlude Options**:
- **Ask Another Question**: Continue to next round (max 3 rounds total)
- **Proceed to Voting**: Move to voting phase immediately

**Response Constraints**:
- AI responses: ~40 words maximum (3 sentences)
- Human responses: 230 characters maximum
- All AI players receive full conversation history for context

#### Phase 3: Voting
1. Moderator announces voting phase
2. Each player votes in turn order (same as Q&A)
3. Players cannot vote for themselves
4. Vote format: "I vote for [name]. [One sentence explanation]"
5. AI players receive only Q&A answers (no moderator/meta-game text) to make voting decisions

**Tiebreaker**: If multiple players tied for most votes, Moderator (Dorkesh) casts the deciding vote.

#### Phase 4: Results
- Moderator counts votes and announces the winner
- **If Human wins**: "ESCAPED!" - You convinced the AIs you were human
- **If AI wins**: "TRAPPED!" - The AIs identified you or voted for each other
- Result screen shows vote breakdown for all players

### Important Game Mechanics

**Context Management**:
- All AI players maintain full conversation history throughout the game
- AI responses are context-aware and reference previous answers
- Voting context is filtered to only include player answers (prevents hallucination)

**Timing & Synchronization**:
- Game waits for audio (TTS) to complete before continuing
- Sequential turn-based flow (no overlapping responses)
- Delays between transitions allow for natural pacing

**AI Persona System**:
- Each AI player has a unique character system prompt
- Characters are told they ARE Claude participating in a demonstration
- Instructed to avoid typical AI patterns (being helpful, structured, hedging)
- Encouraged to embrace inconsistency, uncertainty, and emotional reactivity
- Responses should inhabit the character's perspective, not "sound human"

**Vote Counting**:
- Uses regex parsing to extract player names from voting messages
- Handles multiple mentions by using most frequently mentioned name
- Moderator acts as tiebreaker if needed 

## AI Integration

### AI Models Supported
The game supports multiple AI providers with fallback responses:

**Currently Active**:
- **Google Gemini 2.5 Flash** - Powers all 3 AI players + moderator (free tier)
  - Model: `gemini-2.5-flash`
  - Fast responses with good conversational quality
  - Timeout: 15 seconds

**Available (Not Currently Used)**:
- **Anthropic Claude 3.5 Sonnet** - `claude-3-5-sonnet-20240620`
- **OpenAI GPT-4o-mini** - `gpt-4o-mini`
- **xAI Grok** - `grok-beta` (Player 1 disabled)

### API Architecture
All API calls are proxied through Express backend (`server.js` on port 3001) to protect API keys:

```javascript
POST /api/ai
{
  provider: "google|anthropic|openai|xai",
  systemPrompt: string,
  userPrompt: string,
  conversationHistory: array,
  maxTokens: 3000,
  temperature: 0.8
}
```

**Error Handling**: If an AI provider fails, character-specific fallback responses are used to prevent game crashes.

## Key Features

### Dynamic Conversation System
- **Context-Aware Responses**: AI players receive full conversation history
- **Turn-Based Flow**: Strict sequential turn order with audio synchronization
- **Natural Pacing**: Delays between transitions (1-2 seconds)
- **Character Consistency**: Each AI maintains their unique personality throughout

### AI Personalities
4 unique characters inspired by AI lab leaders and podcast hosts:
- **Wario Amadeuss** - Anxious AI safety researcher (Anthropic-inspired)
- **Domis Hassoiboi** - Analytical chess philosopher (DeepMind-inspired)
- **Scan Ctrl+Altman** - Optimistic AGI accelerationist (OpenAI-inspired)
- **Dorkesh Cartel** - Methodical moderator with dark humor (Dwarkesh Patel-inspired)

### Intelligent Voting System
- **Context-Filtered**: AI voters see only Q&A answers, not meta-game information
- **Regex-Based Parsing**: Extracts votes from natural language responses
- **Tie Resolution**: Moderator automatically breaks ties
- **Self-Vote Prevention**: Players cannot vote for themselves

## Audio Features

### Text-to-Speech (ElevenLabs Integration)
**Sequential Audio Playback**:
- All AI and moderator messages are spoken aloud
- Game waits for TTS to complete before continuing to next turn
- Prevents overlapping speech with queue system
- Next player can only start after previous audio finishes

**Voice Mapping**:
- **Dorkesh Cartel (Moderator)**: Aria voice
- **Elongated Muskett**: Roger voice
- **Wario Amadeuss**: Liam voice
- **Domis Hassoiboi**: George voice
- **Scan Ctrl+Altman**: Will voice

**Settings**:
- Model: `eleven_monolingual_v1`
- Adjustable volume (default 0.7)
- Mute toggle available
- Skip current audio option
- Stability: 0.5, Similarity boost: 0.75

**Fallback**: If ElevenLabs fails or is rate-limited, falls back to Web Speech API (browser TTS)

### Speech Recognition (Voice Input)
**Technology**: Web Speech API (`webkitSpeechRecognition`)

**Features**:
- Push-to-talk interface for human responses
- Automatic 230 character truncation
- Visual "listening" indicator
- Language: en-US
- Only available on Chrome/Edge browsers

**Fallback**: Text input always available if speech recognition not supported

### Audio Synchronization
Critical timing mechanics:
- 2 second delay after moderator intro
- 1 second delay before AI responses
- 1.5 second delay for moderator transitions
- 2 second delay before interlude screen
- 1 second delay between votes
- All delays account for TTS completion (30s timeout safety)

## Browser Compatibility

- **Best Experience**: Chrome/Edge (full speech recognition + TTS)
- **Firefox/Safari**: TTS works, text input only (no voice input)
- **Mobile**: TTS works, limited speech recognition support

## Technical Architecture

### State Management
**Main Game States** (`App.jsx`):
1. `name-entry` - Player enters name
2. `intro` - Three introductory screens
3. `player-selection` - AI character overview + audio setup
4. `game` - Main gameplay loop
5. `result` - Win/lose screen with vote breakdown

**Game Phases** (`useGameLogic.js` hook):
1. `intro` - Moderator welcome
2. `questioning` - Q&A rounds (1-3 rounds)
3. `interlude` - Continue or vote decision
4. `voting` - Sequential voting
5. `result` - Vote counting and winner announcement

### Processing States
- `isProcessing` flag prevents simultaneous AI calls
- Turn order enforcement via `currentTurnIndex`
- Input disabled during AI generation
- Visual indicators for current speaker (green pulse)

### Conversation Context
```javascript
// AI players receive:
{
  systemPrompt: character.systemPrompt,  // Character personality
  conversationHistory: [...],            // Full conversation so far
  userPrompt: currentQuestion            // Current question/prompt
}

// Voting context is filtered:
{
  conversationHistory: [...],            // Only Q&A answers (no moderator/meta)
  availablePlayers: [...],               // Excludes self from options
  format: "I vote for [name]. [reason]"  // Strict format requirement
}
```

## Requirements

- **Required**: At least one AI model API key (Google Gemini recommended)
- **Recommended**: ElevenLabs API key for best audio experience
- **Optional**: SUPABASE_API_KEY for analytics/data storage
- **Browser**: Chrome or Edge recommended for full voice input support
- **Permissions**: Microphone access required for speech recognition

## Game Balance Notes

- Human goes **second** (not last) to reduce strategic advantage
- AI responses limited to ~40 words to match human constraints
- All AIs use same model (Gemini) to ensure fair difficulty
- Voting context filtered to prevent meta-gaming
- Tiebreaker system ensures decisive outcomes