# Reverse Turing

A game where you must prove you're human to escape a simulation filled with AIs.

## Setup

1. Copy `.env.example` to `.env` and add your API keys:
   - OPENAI_API_KEY (optional)
   - ANTHROPIC_API_KEY
   - GOOGLE_API_KEY

2. Install dependencies:
```bash
npm install
```

3. Run the game:
```bash
npm start
```

This will start both the backend server (port 3001) and frontend dev server (port 5173).

## How to Play

1. Enter your name
2. Read the intro screens
3. Select which AI models will play against you
4. Convince the AIs that you're human through conversation
5. Vote on who you think is human (you can't vote for yourself)
6. Win if you get the most votes!

## Features

- **3D Visualization**: Futuristic boardroom scene with animated characters
- **AI Personalities**: 4 unique characters (Corporate Executive, Yoga Instructor, Tech CEO, Pro Gamer)
- **Multi-Model Support**: OpenAI GPT-4, Anthropic Claude, and Google Gemini
- **Dynamic Conversation**: Turn-based conversation system with context awareness
- **Voting Mechanism**: AIs vote on who they think is human
- **Text-to-Speech**: ElevenLabs integration with character-specific voices
- **Speech Recognition**: Voice input using Web Speech API (Chrome/Edge)
- **Audio Controls**: Volume, mute, and audio status indicators

## Audio Features

### Text-to-Speech (TTS)
- Each AI character has a unique voice
- Auto-speaks all AI messages
- Queue system prevents overlapping speech
- Adjustable volume and mute controls

### Speech Recognition
- Voice input for human responses (Chrome/Edge browsers)
- Push-to-talk interface
- Fallback to text input if speech not supported
- Visual indicators for listening state

### Audio Setup
Add your ElevenLabs API key to `.env`:
```
ELEVENLABS_API_KEY=your_key_here
```

## Browser Compatibility

- **Best Experience**: Chrome/Edge (full speech recognition)
- **Firefox/Safari**: TTS works, text input only
- **Mobile**: TTS works, limited speech recognition

## Notes

- The game requires at least one AI model API key
- ElevenLabs is optional but recommended for best experience
- Audio permissions required for speech recognition