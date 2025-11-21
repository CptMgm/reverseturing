# Current Implementation - How Everything Actually Works

## Quick Answers to Your Questions

### **Q: Am I using ElevenLabs for character speech?**
**A: YES** - All AI character voices (Wario, Domis, Scan) AND President Dorkesh use ElevenLabs TTS.

### **Q: Am I using Gemini Live sessions?**
**A: NO** - You're using regular **Gemini REST API** (not Live/WebSocket). The file is misleadingly named `geminiLiveService.js` but it's actually REST.

### **Q: How do I make sure messages are queued correctly and relate to each other?**
**A:** Through `ModeratorController.conversationHistory` (8-message rolling window) + each AI's `session.history` (full conversation context).

### **Q: Where is intelligence coming from? Where is voice coming from?**
**A:**
- **Intelligence**: Google Gemini API (`gemini-2.0-flash` model)
- **Voice**: ElevenLabs API (`eleven_turbo_v2_5` model)

### **Q: Does voice input even work at this point?**
**A: NO** - Voice input exists in old unused components (`AudioControls.jsx`, `audioService.js`) but is **NOT connected** to the current game flow. Currently **TEXT INPUT ONLY**.

---

## 🎯 Complete Architecture Breakdown

### **1. What APIs You're Actually Using**

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR GAME FLOW                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌───────────┐  ┌──────────┐  ┌──────────┐
        │  Gemini   │  │ElevenLabs│  │ Daily.co │
        │   REST    │  │   TTS    │  │ (unused) │
        │   API     │  │   API    │  │          │
        └───────────┘  └──────────┘  └──────────┘
             │              │              │
             │              │              └─> Creates room but
             │              │                  AI audio NOT streamed
             │              │                  through Daily
             │              │
             └─> TEXT       └─> AUDIO
                 ONLY           MP3
```

---

## 🧠 Intelligence: Gemini REST API (NOT Live)

### **Where**: `src/services/geminiLiveService.js`

### **Misleading Name**:
The file is called `geminiLiveService.js` but it uses **REST API**, NOT Gemini Live.

### **Evidence**:
```javascript
// Line 62: REST endpoint, NOT WebSocket
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${session.apiKey}`;

const response = await fetch(url, {
  method: 'POST',  // ← REST API
  body: JSON.stringify({
    contents: session.history,  // ← Full conversation history
    generationConfig: {
      response_modalities: ["TEXT"],  // ← TEXT ONLY, no audio
      temperature: 0.9,
      maxOutputTokens: 150
    }
  })
});
```

### **How It Works**:

1. **Session Initialization** (line 12-30):
   ```javascript
   initializeSession(playerId, name, prompt, apiKey) {
     this.sessions.set(playerId, {
       name: "Wario Amadeuss",
       apiKey: "your-gemini-key",
       systemPrompt: "You are Wario, paranoid and dramatic...",
       history: [
         { role: "user", parts: [{ text: PERSONA_PROMPT }] },
         { role: "model", parts: [{ text: "Understood. I am ready to roleplay." }] }
       ]
     });
   }
   ```

2. **Sending Messages** (line 35-125):
   ```javascript
   async sendText(text, targetPlayerId, conversationContext) {
     // Build context-aware prompt with recent conversation
     const recentConvo = conversationContext.recentMessages
       .map(msg => `${msg.speaker}: "${msg.text}"`)
       .join('\n');

     const contextualPrompt = `
       [Recent conversation]
       ${recentConvo}

       [Your turn to respond naturally to continue this conversation.]
     `;

     // Add to this AI's personal history
     session.history.push({ role: "user", parts: [{ text: contextualPrompt }] });

     // Call Gemini API with FULL history
     const response = await fetch(url, {
       body: JSON.stringify({ contents: session.history })
     });

     // Post-process response to replace "You" with player name
     let responseText = data.candidates[0].content.parts[0].text;
     responseText = responseText.replace(/\b(You|YOU)([?,!\s])/g, `${humanName}$2`);

     // Add AI response to history
     session.history.push({ role: "model", parts: [{ text: responseText }] });

     // Send to ModeratorController for TTS
     this.moderatorController.onAIResponse(targetPlayerId, responseText, null);
   }
   ```

3. **Context Management**:
   - **Each AI has own `session.history`** = full conversation from that AI's perspective
   - **ModeratorController has `conversationHistory`** = rolling 8-message window shared across all AIs
   - When AI needs to respond, it gets:
     - Its own full history (all previous responses it made)
     - Recent 5-8 messages from conversation (for context)

---

## 🗣️ Voice: ElevenLabs TTS API

### **Where**: `server.js` lines 537-588

### **How It Works**:

```javascript
// Voice ID mapping (hardcoded)
const voiceMap = {
  'moderator': '21m00Tcm4TlvDq8ikWAM',  // President Dorkesh
  'player2': 'JBFqnCBsd6RMkjVDRZzb',    // Wario (George voice)
  'player3': 'pqHfZKP75CvOlQylNhV4',    // Domis (Bill voice)
  'player4': 'N2lVS1w4EtoT3dr4eOWO',    // Scan (Callum voice)
};

async function generateTTS(text, playerId) {
  const voiceId = voiceMap[playerId];

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,        // More expressive
          similarity_boost: 0.75 // Stay close to voice profile
        }
      })
    }
  );

  // Convert to base64 for WebSocket transmission
  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer).toString('base64');
}
```

### **Pipeline**:
```
Gemini generates text → ElevenLabs converts to MP3 → Base64 encode →
WebSocket to client → Client decodes → Web Audio API phone effect →
Play through browser
```

---

## 🔄 Message Queue & Context Management

### **Two-Level Context System**:

#### **Level 1: ModeratorController.conversationHistory** (Global)
- **Location**: `src/services/moderatorController.js:12`
- **Purpose**: Shared conversation history visible to all AIs
- **Size**: Rolling 8-message window
- **Structure**:
  ```javascript
  conversationHistory = [
    { playerId: "moderator", speaker: "President Dorkesh", text: "...", timestamp: 123 },
    { playerId: "player1", speaker: "Chris", text: "...", timestamp: 124 },
    { playerId: "player2", speaker: "Wario Amadeuss", text: "...", timestamp: 125 },
    // ... up to 8 most recent
  ]
  ```

#### **Level 2: GeminiLiveService.sessions[playerId].history** (Per-AI)
- **Location**: `src/services/geminiLiveService.js:25-28`
- **Purpose**: Each AI's personal conversation memory
- **Size**: Unlimited (grows throughout game)
- **Structure**:
  ```javascript
  sessions.get('player2').history = [
    { role: "user", parts: [{ text: "System prompt: You are Wario..." }] },
    { role: "model", parts: [{ text: "Understood. I am ready to roleplay." }] },
    { role: "user", parts: [{ text: "[Recent conversation]\nChris: Hi\nDomis: Hello\n\n[Your turn]" }] },
    { role: "model", parts: [{ text: "Hello everyone! This is CRAZY!" }] },
    // ... entire conversation from Wario's perspective
  ]
  ```

### **How Context Flows**:

```
1. Human types: "Wario, are you a bot?"
         ↓
2. GameContext.sendHumanInput() sends via WebSocket
         ↓
3. Server receives HUMAN_INPUT
         ↓
4. moderatorController.addToConversationHistory('player1', text)
         ↓
5. moderatorController.routeHumanMessage() detects "Wario" mentioned
         ↓
6. Gets conversationContext (last 8 messages)
         ↓
7. geminiLiveService.sendText(text, 'player2', conversationContext)
         ↓
8. GeminiLiveService builds contextual prompt:
   ```
   [Recent conversation]
   Chris: "Hi everyone"
   Domis: "Hello Chris"
   Scan: "Yo what's up"
   Chris: "Wario, are you a bot?"

   [Your turn to respond naturally]
   ```
         ↓
9. Adds to Wario's personal history + calls Gemini API
         ↓
10. Gemini generates: "ME?! A BOT?! This is INSANE!"
         ↓
11. Post-process: Replace "You" with "Chris"
         ↓
12. Add to Wario's history + ModeratorController.conversationHistory
         ↓
13. Call ElevenLabs TTS with response text
         ↓
14. Send audio to client via WebSocket
         ↓
15. Client plays with phone effect
```

### **Queue Enforcement** (`moderatorController.js:206-239`):

```javascript
// Add message and track speakers
addToConversationHistory(playerId, text) {
  this.conversationHistory.push({ playerId, speaker, text, timestamp });

  // Track last 2 speakers to prevent repetition
  this.recentSpeakers.push(playerId);
  if (this.recentSpeakers.length > 2) {
    this.recentSpeakers.shift();
  }

  // Detect if someone was asked a direct question
  const mentionedPlayer = this.detectDirectQuestion(text);
  if (mentionedPlayer) {
    this.waitingForResponseFrom = mentionedPlayer;  // Force them to respond next
    this.questionAskedAt = Date.now();
  }

  // Clear waiting flag if that person responds
  if (this.waitingForResponseFrom === playerId) {
    this.waitingForResponseFrom = null;
  }

  // Keep only 8 most recent
  if (this.conversationHistory.length > 8) {
    this.conversationHistory.shift();
  }
}
```

---

## 🎙️ Voice Input: CURRENTLY NOT WORKING

### **Why Voice Input Doesn't Work**:

1. **Old Components Exist But Unused**:
   - `src/components/AudioControls.jsx` - UI for mic controls
   - `src/services/audioService.js` - Speech recognition wrapper

2. **Not Connected to Game Flow**:
   ```javascript
   // GameRoom.jsx - NO AudioControls imported or used
   import VideoGrid from './VideoGrid';
   import VoteControls from './VoteControls';
   import PresidentOverlay from './PresidentOverlay';
   // ❌ AudioControls NOT imported
   ```

3. **Current Input Method**:
   ```javascript
   // GameRoom.jsx:155-171 - TEXT INPUT ONLY
   <form onSubmit={handleSend}>
     <input
       type="text"
       value={inputText}
       onChange={(e) => setInputText(e.target.value)}
       placeholder="Type a message..."
     />
     <button type="submit">Send</button>
   </form>
   ```

4. **What Would Need to Happen**:
   ```javascript
   // audioService.js has speech recognition:
   setupSpeechRecognition() {
     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     if (!SpeechRecognition) return;

     this.speechRecognition = new SpeechRecognition();
     this.speechRecognition.continuous = false;
     this.speechRecognition.interimResults = false;

     this.speechRecognition.onresult = (event) => {
       const transcript = event.results[0][0].transcript;
       // ❌ THIS CALLBACK IS NEVER CONNECTED TO sendHumanInput()
     };
   }
   ```

### **To Make Voice Input Work**:

Need to:
1. Import `AudioControls` in `GameRoom.jsx`
2. Import `audioService` in `GameContext.jsx`
3. Connect `audioService.onTranscript` callback to `sendHumanInput()`
4. Add voice/text mode toggle
5. Handle browser permissions for microphone

---

## 🎮 Daily.co: Created But Mostly Unused

### **What Daily.co Actually Does**:

```javascript
// server.js:206-264 - Creates room
async function createDailyRoom() {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: `reverse-turing-${randomId}`,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 7200,  // 2 hours
        max_participants: 5
      }
    })
  });
  return data.url;  // e.g., https://learnanything.daily.co/wiBdBzaaIEuh8nc6Jgw0
}

// GameRoom.jsx:17-34 - Joins room
useEffect(() => {
  if (dailyUrl) {
    const callFrame = DailyIframe.createFrame(dailyRef.current);
    callFrame.join({ url: dailyUrl });
  }
}, [dailyUrl]);

// GameRoom.jsx:112-114 - Hidden iframe
<div className="absolute inset-0 z-0 opacity-0 pointer-events-none">
  <div ref={dailyRef} className="w-full h-full" />
</div>
```

### **What It's NOT Used For**:
- ❌ AI audio is NOT streamed through Daily
- ❌ Human microphone input is NOT sent through Daily
- ❌ Video streams are NOT used (iframe is hidden with `opacity-0`)

### **What It Could Be Used For** (Future):
- ✅ Real-time voice chat between human players (if multiplayer)
- ✅ Recording game sessions
- ✅ Lower-latency audio streaming
- ✅ Video avatars for players

---

## 🎨 Current User Experience Flow

### **1. LOBBY Phase** (Text Input Only)
```
┌──────────────────────────────────────┐
│  Reverse Turing Test                 │
│                                      │
│  [Enter your name...]                │
│  [Enter Simulation]                  │
└──────────────────────────────────────┘
```

### **2. CALL_CONNECTING Phase**
- Daily.co room created
- Hidden iframe joins room
- All AI "players" connect (simulated)

### **3. PRESIDENT_INTRO Phase**
```
Gemini generates President's intro text
        ↓
ElevenLabs converts to voice (385 credits)
        ↓
Client plays audio with phone effect
        ↓
President "leaves" (disconnects from Daily)
```

### **4. FREE_DEBATE Phase** (Current Broken State)
```
AI Turn:
  Gemini generates text → ElevenLabs TTS (385 credits) →
  ❌ QUOTA EXCEEDED → No audio sent →
  Client shows "Missing Audio" error →
  Game continues silently

Human Turn:
  User types in chat input → Sends via WebSocket →
  Server routes to appropriate AI → AI responds (no audio)
```

### **5. What User CAN'T Do Right Now**:
- ❌ Speak with microphone (no voice input connected)
- ❌ Hear AI voices (ElevenLabs quota exhausted)
- ❌ Choose between voice/text mode (no selection panel)
- ❌ See conversation history in chat (not implemented)

---

## 🔧 What Needs to Be Fixed/Implemented

### **Immediate (Blocking)**:
1. **ElevenLabs Quota**: Upgrade plan or implement fallback TTS
2. **Voice/Text Mode Selection**: Panel during president intro

### **High Priority**:
3. **Voice Input**: Connect audioService to sendHumanInput()
4. **Conversation History**: Display messages in chat sidebar
5. **Turn Indicator**: Green border when it's your turn

### **Medium Priority**:
6. **Typing Indicators**: Show "[Name] is typing..."
7. **Better Daily Integration**: Use for actual voice streaming
8. **Error Handling**: Graceful fallbacks when APIs fail

---

## 📝 Summary Table

| Component | Current State | What It Does | Where It Lives |
|-----------|--------------|--------------|----------------|
| **Gemini API** | ✅ Working | Generates AI text responses | `geminiLiveService.js` (REST, not Live) |
| **ElevenLabs API** | ❌ Quota Exceeded | Converts text to voice | `server.js:537-588` |
| **Daily.co API** | ⚠️ Half-Working | Creates room but not used for audio | `server.js:206-264` |
| **Voice Input** | ❌ Not Connected | Speech recognition exists but unused | `audioService.js` |
| **Text Input** | ✅ Working | Types messages in chat | `GameRoom.jsx:155-171` |
| **Context Management** | ✅ Working | 8-message rolling window + per-AI history | `moderatorController.js` + `geminiLiveService.js` |
| **Turn-Taking** | ✅ Working | Force-response system for direct questions | `moderatorController.js:245-282` |
| **Audio Playback** | ✅ Working | Plays base64 MP3 with phone effect | `GameContext.jsx:117-209` |
| **Mode Selection** | ❌ Missing | Voice/text choice panel | Not implemented |

---

## 🚀 Next Steps

1. **For Testing**: Implement browser TTS fallback (I can do this now)
2. **For Production**: Upgrade ElevenLabs to Creator Plan ($11/month)
3. **For Voice Input**: Connect audioService to game flow
4. **For UX**: Add voice/text mode selection panel (I'll implement this now)
