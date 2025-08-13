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

## Features

- **3D Visualization**: Futuristic boardroom scene with animated characters
- **AI Personalities**: 4 unique characters 
- **Multi-Model Support**: OpenAI GPT-4, , xAI Grok, Anthropic Claude, and Google Gemini
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