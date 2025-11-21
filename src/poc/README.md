# Gemini Live API POC

This Proof of Concept demonstrates managing **4 simultaneous Gemini Live WebSocket sessions** for the Reverse Turing Test game.

## Key Concepts Demonstrated

### 1. **Multi-Session Management**
- 4 WebSocket connections running concurrently (one per AI character)
- Only ONE session is "active" at a time
- Inactive sessions remain connected but idle

### 2. **Selective Activation**
- Characters only respond when explicitly addressed by name
- System prompts enforce this: "You may only speak when your name is mentioned"
- This simulates the "hot seat" turn-based mechanic

### 3. **Direct Audio Output**
- No TTS needed - Gemini Live natively generates speech
- Each character has a unique voice (Kore, Fenrir, Puck, Charon)
- Audio is base64 encoded PCM, playback via Web Audio API

### 4. **Live Transcription**
- Gemini Live returns both AUDIO and TEXT simultaneously
- Text appears in real-time as the character speaks
- Can be used to populate the chat UI

## How to Test

### Option 1: Standalone HTML File

1. Open `geminiLivePOC.html` in a browser
2. Enter your Gemini API key when prompted
3. Click "Connect All Sessions" - watch all 4 characters connect
4. Type a message like: "Wario, what do you think about AI safety?"
5. Select "Wario" from the dropdown
6. Click "Send to Active Character"
7. Watch Wario's session activate, respond with audio + transcript

### Option 2: Local Server

```bash
# From the project root
npm run dev

# Navigate to:
# http://localhost:5173/src/poc/geminiLivePOC.html
```

## How It Works

### Connection Flow
```
1. WebSocket opens to wss://generativelanguage.googleapis.com/...
2. Send setup message with:
   - Model: gemini-2.5-flash-native-audio-preview-09-2025
   - Response modalities: AUDIO + TEXT
   - Voice config: character-specific voice
   - System instruction: persona + "only speak when named"
3. Receive setupComplete confirmation
4. Session is ready, waiting for input
```

### Message Flow
```
User → "Domis, tell me about chess"
      ↓
Select Domis as active session
      ↓
Send client_content message to Domis's WebSocket
      ↓
Other sessions (Wario, Scan, President) remain silent
      ↓
Domis receives question, generates response
      ↓
Response streams back as:
   - text parts (transcript)
   - inlineData parts (audio chunks)
      ↓
UI updates transcript + plays audio
      ↓
turnComplete signal received
      ↓
Session returns to idle
```

## Key Implementation Details

### 1. Voice Selection
```javascript
const voices = {
    player2: 'Kore',      // Wario - mature, thoughtful
    player3: 'Fenrir',    // Domis - intellectual
    player4: 'Puck',      // Scan - energetic, manic
    moderator: 'Charon'   // President - authoritative
};
```

### 2. System Prompts with Name-Gating
```javascript
systemPrompt: `You are Wario Amadeuss...
IMPORTANT: You may only speak when directly asked a
question that mentions your name "Wario".
If not addressed to you, stay silent.`
```

This ensures characters don't interrupt each other.

### 3. Audio Playback
```javascript
// Base64 → ArrayBuffer → AudioBuffer → Play
const bytes = atob(base64Audio);
const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(audioContext.destination);
source.start();
```

## Next Steps for Full Integration

1. **Replace useGameLogic.js AI calls**
   - Instead of OpenAI/Anthropic API calls
   - Use GeminiLiveService.sendText()

2. **Activate sessions in sequence**
   ```javascript
   // When it's Wario's turn:
   geminiLive.setActiveSession('player2');
   geminiLive.sendContextDump('player2', conversationHistory);
   ```

3. **Stream audio to Daily.co**
   - Instead of playing locally
   - Send Gemini's audio output to Daily tracks

4. **Use live transcript for chat UI**
   - Replace the typing animation
   - Display real-time text as it arrives

## Performance Expectations

- **Latency**: ~200-500ms from send to first audio chunk
- **Streaming**: Audio chunks arrive in real-time
- **Cost**: ~$0.001 per turn (way cheaper than TTS!)
- **Quality**: Native audio generation = more natural speech

## Troubleshooting

### "WebSocket failed to connect"
- Check API key is valid
- Ensure you're using the correct endpoint
- Check browser console for CORS errors

### "No audio plays"
- Check browser autoplay policy (user interaction required)
- Verify Web Audio API is supported
- Check audio decode errors in console

### "Character speaks when not addressed"
- Strengthen the system prompt
- Add more explicit name-gating logic
- Could add pre-send filtering on client side

## Architecture Benefits

✅ **Lower latency** - Direct WebSocket, no API round trips
✅ **Real-time streaming** - Audio arrives as it's generated
✅ **Cheaper** - Single API call vs separate TTS
✅ **More natural** - Native audio generation
✅ **Simultaneous sessions** - All characters "listening" at once
✅ **Easy turn control** - Just activate the right session

---

**Status**: POC Ready for Testing
**Next**: Test with real API key, then integrate into main game
