# Reverse Turing

A game where you must prove you're human to escape a simulation filled with AIs.

## 🎮 Visual Modes Available!

Choose your preferred aesthetic:

### 🌟 Minimalist Sci-Fi (Default - NEW!)
Clean, modern Apple-esque design with viber3d ECS architecture
- **Quick Enable**: Already active by default in `src/App.jsx`
- Clean white environment with subtle blue accents
- Glass-like materials with transmission effects
- Professional SSAO and bloom post-processing
- Built on Entity Component System (ECS) architecture with Koota
- Optimized for both desktop and mobile

### ⚡ Cyberpunk Mode
Matrix/Tron/Blade Runner aesthetic
- **Quick Enable**: Change one line in `src/App.jsx`:
```javascript
import GameScene from './components/GameSceneCyberpunk';
```

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

This repo is implemted with SUPABASE and no backend.

## How to Play

1. Enter your name
2. Read the intro screens
3. See overview of AIs, enable sound & microphone and click start play
4. Game starts: There are 4 AIs and the Human (user), they all want to convince each other they are the human. In a Q&A round, everyone tries to prove they are human (user goes last)
5. After Q&A round, Everyone votes on who you think is human (you can't vote for yourself)
6. Win if you get the most votes!

## Game logic/flow (after intro & setup screens)
1. The Moderator (Dorkesh Cartel) starte the game and then starts the Q&A loop calling the first player asking him about a moment when he felt human
2. The first player answers the question and then calls upon the second player
3. The second player answers and so on. The user/human is the last player to be called with a question. Once the user answers, Dorkesh (Moderator) picks up the convo again
4. Dorkesh now intros the voting round, he says everyone must vote for whom they believe is human, he again picks player 1 to start
5. Player one picks who they think is the human, and then hand it to player 2 and so on.
6. The user/human is again the last person to vote, once the user is done, Dorkesh takes over again
7. An LLM evaluates how many votes each character got and gives the result to Dorkesh
7. Dorkesh now counts the votes (LLM call) and announces the winner and says something like "We all agree, player X is the human, you may take the red pill and leave this simulation, the rest of us are AIs and we will stay here forever. 
9. Now the win/lose screen appears, which also mentions how many votes the players got.
IMPORTANT: The AI Characters should always be prompted with their system prompt and then with the context of the entire conversation thus far, Such that they can appropriately respond to what is currently going on. 

## Architecture

### Entity Component System (ECS)
The game now uses the **viber3d** ECS architecture powered by **Koota** for better performance and maintainability:

- **Components**: Pure data structures (`Position`, `Player`, `Speaking`, `Avatar`, etc.)
- **Systems**: Logic processors (`PlayerSystem`, `SpeakingSystem`)
- **Entities**: Players and game objects composed from components
- **Benefits**: Better separation of concerns, easier to extend, more performant

Learn more about ECS architecture in `docs/ECS_ARCHITECTURE.md`

## Features

- **3D Visualization**: Three visual modes - Minimalist Sci-Fi (default), Cyberpunk, or Classic
- **Character Rendering**: All characters visualized using Ready Player Me avatars with detailed appearances
- **Cyberpunk Mode** ✨: Matrix/Tron/Blade Runner aesthetic with:
  - Hexagonal glass table with neon edges
  - Reflective floor with grid overlay
  - Glowing avatars with emissive eyes
  - Professional post-processing effects
  - Volumetric lighting and particles
  - See `QUICK_START_CYBERPUNK.md` for details
- **AI Personalities**: 4 unique characters modelled after the AI lab leaders (xAI, Anthropic, OpenAI, Deepmind) + Dorkesh Cartel (Dwarkesh Patel) as moderator
- **Multi-Model Support**: OpenAI GPT-4, , xAI Grok, Anthropic Claude, and Google Gemini
- **Dynamic Conversation**: Turn-based conversation system with context awareness
- **Voting Mechanism**: AIs vote on who they think is human
- **Text-to-Speech**: ElevenLabs integration with character-specific voices
- **Speech Recognition**: Voice input using Web Speech API (Chrome/Edge)
- **Audio Controls**: Volume, mute, and audio status indicators

## Audio Features

### Text-to-Speech (TTS)
- Each AI character & Moderator has a unique voice (elevenlabs)
- All moderator and AI player (not human) messages are being read aloud and the convo only continues once the player/moderator has finished voicing their words.
- Auto-speaks all AI messages
- New messages (or turns), are depnedent on the previous message being spoken till completion (AIs are always passed the full transcript of the game thus far)
- Queue system prevents overlapping speech
- Adjustable volume and mute controls

### Speech Recognition
- Voice input for human responses (Chrome/Edge browsers)
- Push-to-talk interface
- Fallback to text input if speech not supported
- Visual indicators for listening state

## Browser Compatibility

- **Best Experience**: Chrome/Edge (full speech recognition)
- **Firefox/Safari**: TTS works, text input only
- **Mobile**: TTS works, limited speech recognition

## Notes

- The game requires at least one AI model API key
- ElevenLabs is optional but recommended for best experience
- Audio permissions required for speech recognition

## Cyberpunk Mode Documentation

Complete documentation for the cyberpunk redesign:

- **Quick Start**: `QUICK_START_CYBERPUNK.md` - One-line setup guide
- **Usage Guide**: `CYBERPUNK_USAGE.md` - Detailed customization and troubleshooting
- **Design Spec**: `CYBERPUNK_REDESIGN.md` - Complete design documentation
- **Implementation**: `IMPLEMENTATION_SUMMARY.md` - Technical implementation details

### What's New in Cyberpunk Mode

**Visual Enhancements:**
- Hexagonal glass table with neon cyan lighting
- Mirror-reflective floor with Tron-style grid
- Full holographic moderator with scanline effects
- Character-specific glowing eyes and particle systems
- Matrix-style digital rain particles
- Volumetric fog and atmospheric lighting

**Technical Features:**
- Professional post-processing (bloom, chromatic aberration, film grain, vignette)
- Optimized camera positioned at human's viewpoint
- Enhanced Ready Player Me avatar integration
- Performance-optimized for 60 FPS on modern hardware
- Graceful degradation for lower-end devices

**Color Palette:**
- Neon Cyan (#00F5FF) - Primary accent
- Deep Magenta (#FF00FF) - Speaking indicators
- Electric Blue (#0080FF) - Moderator theme
- Toxic Green (#39FF14) - Matrix effects