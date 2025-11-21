import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import ModeratorController from './src/services/moderatorController.js';
import { initializeGeminiLive } from './src/services/geminiLiveService.js';
import { getPlayerPrompt } from './src/utils/reverseGamePersonas.js';

dotenv.config();

// ====== SESSION LOG FILE MANAGEMENT ======
let currentSessionTimestamp = null;
let currentApiLogPath = null;
let currentConversationLogPath = null;

function initializeSessionLogs() {
  // Create logs directory if it doesn't exist
  if (!existsSync('logs')) {
    mkdirSync('logs');
  }

  // Create timestamp for this session (format: YYYY-MM-DD_HH-MM-SS)
  const now = new Date();
  currentSessionTimestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '');

  currentApiLogPath = join('logs', `api_${currentSessionTimestamp}.jsonl`);
  currentConversationLogPath = join('logs', `conversation_${currentSessionTimestamp}.txt`);

  console.log(`📝 [Logging] Session started: ${currentSessionTimestamp}`);
  console.log(`📝 [Logging] API log: ${currentApiLogPath}`);
  console.log(`📝 [Logging] Conversation log: ${currentConversationLogPath}`);
}

// ====== COMPREHENSIVE LOGGING UTILITY ======
export const apiLogger = {
  log(service, direction, playerId, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service,
      direction,
      playerId,
      data
    };

    // Write to timestamped log file (no console spam)
    try {
      if (!currentApiLogPath) initializeSessionLogs();
      appendFileSync(currentApiLogPath, JSON.stringify(logEntry) + '\n');
    } catch (e) {
      console.error('❌ Failed to write API log:', e);
    }
  },

  logConversation(playerId, speaker, text) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${speaker} (${playerId}): ${text}`;

    try {
      if (!currentConversationLogPath) initializeSessionLogs();
      appendFileSync(currentConversationLogPath, logEntry + '\n');
    } catch (e) {
      console.error('❌ Failed to write conversation log:', e);
    }
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Initialize Game Services
const moderatorController = new ModeratorController();
const geminiLiveService = initializeGeminiLive(); // No single key anymore

// Connect services
geminiLiveService.moderatorController = moderatorController;
geminiLiveService.apiLogger = apiLogger; // Pass logger for Gemini API logging
moderatorController.geminiService = geminiLiveService;

// Initialize AI Players
async function initializeAIPlayers() {
  const players = ['player2', 'player3', 'player4'];
  console.log('🤖 [Server] Initializing AI players with WebSockets...');

  // Map players to their specific API keys
  const apiKeys = {
    'player2': process.env.GOOGLE_API_KEY_F3 || process.env.GOOGLE_API_KEY,
    'player3': process.env.GOOGLE_API_KEY_SEL || process.env.GOOGLE_API_KEY,
    'player4': process.env.GOOGLE_API_KEY_AP || process.env.GOOGLE_API_KEY
  };

  for (const playerId of players) {
    try {
      const humanPlayerName = moderatorController.players.player1.name;
      const prompt = getPlayerPrompt(playerId, false, humanPlayerName);
      const name = moderatorController.players[playerId].name;
      const key = apiKeys[playerId];

      if (!key) {
        console.warn(`⚠️ [Server] No API key found for ${playerId}. Check .env (GOOGLE_API_KEY_WARIO, etc.)`);
      }

      await geminiLiveService.initializeSession(playerId, name, prompt, key);
    } catch (error) {
      console.error(`❌ [Server] Failed to initialize ${playerId}:`, error);
    }
  }
  console.log('✅ [Server] AI players initialized');
}

// Initialize on startup
initializeAIPlayers();

// Handle WebSocket connections from frontend
wss.on('connection', (ws) => {
  console.log('🔌 [Server] Client connected');

  // Send initial game state
  ws.send(JSON.stringify({
    type: 'GAME_STATE',
    payload: moderatorController.getGameState()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 [Server] Received:', data);

      switch (data.type) {
        case 'START_GAME':
          // Initialize new session logs for this game
          initializeSessionLogs();

          // Set player name if provided
          if (data.payload && data.payload.playerName) {
            moderatorController.players.player1.name = data.payload.playerName;
            console.log(`👤 [Server] Player 1 name set to: ${data.payload.playerName}`);
          }

          // Start the join sequence
          moderatorController.startGame();
          broadcastGameState();

          // Create Daily room
          createDailyRoom().then(url => {
            if (url) {
              ws.send(JSON.stringify({
                type: 'DAILY_ROOM',
                payload: { url }
              }));

              // Start the simulated join sequence
              runJoinSequence();
            }
          });
          break;

          // ... (skip to onTriggerAiResponse)

          moderatorController.onTriggerAiResponse = async (targetPlayerId, context) => {
            // Random delay between 4 and 7 seconds to create "intentional pauses"
            // This gives the human player a chance to speak.
            const delay = Math.floor(Math.random() * 3000) + 4000;

            setTimeout(async () => {
              console.log(`🤖 [Server] Triggering auto-response for ${targetPlayerId} after ${delay}ms`);

              // Construct a prompt that includes the previous speaker's name and text
              // This gives the AI the necessary context to respond relevantly
              // Also encourage them to include the human (Player 1)
              const prompt = `[${context.speakerName}]: "${context.transcript}"\n\n(Respond naturally. Keep your persona. Occasionally ask '${moderatorController.players.player1.name}' (the human) for their opinion to test them.)`;

              try {
                await geminiLiveService.sendText(prompt, targetPlayerId);
              } catch (e) {
                console.error(`❌ [Server] Auto-response failed for ${targetPlayerId}:`, e);
              }
            }, delay);
          };

        case 'AUDIO_COMPLETE':
          const { playerId } = data.payload;
          console.log(`🔊 [Server] Audio complete for ${playerId}`);
          console.log(`🔍 [Server] Current Phase: ${moderatorController.currentPhase}`);

          moderatorController.onAudioComplete();

          // Check if we need to transition from PRESIDENT_INTRO
          if (moderatorController.currentPhase === 'PRESIDENT_INTRO' && playerId === 'moderator') {
            console.log('🏛️ [Server] President Intro finished. Triggering transition...');
            moderatorController.onPresidentIntroComplete();
            broadcastGameState();

            // Trigger self-organization broadcast
            console.log('📢 [Server] Broadcasting prompt to AIs...');
            geminiLiveService.broadcastText("The President has left. One of you must take charge. Who will it be?", ['player2', 'player3', 'player4']);
          } else {
            console.log(`ℹ️ [Server] No transition triggered. (Phase: ${moderatorController.currentPhase}, Player: ${playerId})`);
          }
          break;

        case 'SET_COMMUNICATION_MODE':
          // User selected voice or text mode
          const { mode } = data.payload;
          console.log(`🎙️ [Server] User selected communication mode: ${mode}`);
          moderatorController.setCommunicationMode(mode);
          broadcastGameState();
          break;

        case 'USER_TYPING_START':
          console.log(`⌨️ [Server] User started typing`);
          moderatorController.onUserTyping();
          break;

        case 'USER_TYPING_STOP':
          console.log(`⏸️ [Server] User stopped typing`);
          moderatorController.onUserStoppedTyping();
          break;

        case 'HUMAN_INPUT':
          // Add human message to conversation history
          const humanName = moderatorController.players.player1.name;

          // Log conversation
          apiLogger.logConversation('player1', humanName, data.payload.text);

          moderatorController.addToConversationHistory('player1', data.payload.text);

          // Route message to appropriate AI
          const routing = moderatorController.routeHumanMessage(data.payload.text);
          const conversationContext = moderatorController.getConversationContext();

          if (routing.targetPlayerId === 'broadcast') {
            // Send to all AIs (Self-Organization phase)
            // In reality, we might pick one or send to all active sessions
            // For now, let's just send to player2 as a default or random
            geminiLiveService.sendText(data.payload.text, 'player2', conversationContext);
          } else {
            geminiLiveService.sendText(data.payload.text, routing.targetPlayerId, conversationContext);
          }
          break;

        case 'CAST_VOTE':
          const { targetPlayerId } = data.payload;
          console.log(`🗳️ [Server] Human voted for ${targetPlayerId}`);
          moderatorController.registerVote('player1', targetPlayerId);
          broadcastGameState();
          break;

        case 'CALL_PRESIDENT':
          const verdict = moderatorController.callPresidentBack();
          if (verdict) {
            broadcastGameState();
            broadcast({
              type: 'AUDIO_PLAYBACK',
              payload: {
                playerId: 'moderator',
                transcript: verdict.text,
                outcome: verdict.outcome
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('❌ [Server] Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 [Server] Client disconnected');
  });
});

// Helper to broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

function broadcastGameState() {
  broadcast({
    type: 'GAME_STATE',
    payload: moderatorController.getGameState()
  });
}

// Moderator Controller Callbacks
moderatorController.onPhaseChange = (newPhase) => {
  broadcastGameState();
};

moderatorController.onPlayerConnectionChange = (connectedPlayers) => {
  broadcastGameState();
};

moderatorController.onVoteUpdate = (votes) => {
  broadcastGameState();
};

moderatorController.onConsensusReached = (consensus) => {
  broadcastGameState();
};

moderatorController.onSecretModeratorSelected = async (playerId) => {
  // Update the AI's session with Secret Moderator instructions
  const humanName = moderatorController.players.player1.name;

  // Use dynamic import for ES modules
  const { secretModeratorAddendum } = await import('./src/utils/reverseGamePersonas.js');
  const instructions = secretModeratorAddendum.replace(/\[PLAYER_NAME\]/g, humanName);

  geminiLiveService.addInstructionsToSession(playerId, instructions);
  console.log(`👑 [Server] Secret Moderator instructions sent to ${playerId}`);
};

moderatorController.onAudioPlayback = async (playbackItem) => {
  let audioData = playbackItem.audioData;

  // If no audio data (e.g. from text-only Gemini), generate it via TTS
  if (!audioData || audioData.length === 0) {
    console.log(`🗣️ [Server] Generating TTS for ${playbackItem.playerId}...`);

    // Log conversation message
    const speaker = moderatorController.players[playbackItem.playerId]?.name || playbackItem.playerId;
    apiLogger.logConversation(playbackItem.playerId, speaker, playbackItem.transcript);

    try {
      const ttsBuffer = await generateTTS(playbackItem.transcript, playbackItem.playerId);
      if (ttsBuffer) {
        console.log(`✅ [Server] TTS generated successfully for ${playbackItem.playerId} (${ttsBuffer.length} bytes)`);
        audioData = ttsBuffer.toString('base64');
      } else {
        console.error(`❌ [Server] TTS returned null for ${playbackItem.playerId}`);
      }
    } catch (e) {
      console.error(`❌ [Server] TTS Generation failed for ${playbackItem.playerId}:`, e);
    }
  } else if (Array.isArray(audioData)) {
    // If it's an array of chunks (from previous implementation), join them or take the first
    // For simplicity, let's assume it's a single base64 string or we handle it on frontend.
    // But wait, frontend expects a single base64 string usually.
    // If it's an array, let's just take the first chunk or join them if they are buffers? 
    // Gemini REST returns one chunk usually.
    audioData = audioData[0];
  }

  // Send audio to frontend to play
  console.log(`📢 [Server] Broadcasting AUDIO_PLAYBACK for ${playbackItem.playerId}`);
  broadcast({
    type: 'AUDIO_PLAYBACK',
    payload: {
      playerId: playbackItem.playerId,
      transcript: playbackItem.transcript,
      audioData: audioData // Base64 audio
    }
  });
};

moderatorController.onTriggerAiResponse = async (targetPlayerId, context) => {
  // Random delay between 3 and 6 seconds to create "intentional pauses"
  // This gives the human player a chance to speak.
  const delay = Math.floor(Math.random() * 3000) + 3000;

  setTimeout(async () => {
    console.log(`🤖 [Server] Triggering auto-response for ${targetPlayerId} after ${delay}ms`);

    // Get conversation context for better situational awareness
    const conversationContext = moderatorController.getConversationContext();

    // Construct a prompt that includes the previous speaker's name and text
    // This gives the AI the necessary context to respond relevantly
    const humanName = moderatorController.players.player1.name;
    const prompt = `[${context.speakerName} just said]: "${context.transcript}"\n\n[Respond naturally to what was just said. Stay in character. Keep it under 30 words. If ${humanName} has been quiet, maybe direct a question at them.]`;

    try {
      await geminiLiveService.sendText(prompt, targetPlayerId, conversationContext);
    } catch (e) {
      console.error(`❌ [Server] Auto-response failed for ${targetPlayerId}:`, e);
    }
  }, delay);
};

// Helper for TTS generation (reusing the logic from /api/tts)
async function generateTTS(text, playerId = 'unknown') {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  // Voice mapping for different characters
  const voiceMap = {
    'moderator': 'nPczCjzI2devNBz1zQrb',  // President (Brian)
    'player2': 'JBFqnCBsd6RMkjVDRZzb',    // Wario (George)
    'player3': 'pqHfZKP75CvOlQylNhV4',    // Domis (Bill)
    'player4': 'N2lVS1w4EtoT3dr4eOWO',    // Scan (Callum)
  };

  const voiceId = voiceMap[playerId] || 'nPczCjzI2devNBz1zQrb';

  // Log TTS request
  apiLogger.log('ElevenLabs', 'request', playerId, {
    text: text,
    textLength: text.length,
    voiceId: voiceId,
    model: "eleven_monolingual_v1",
    estimatedCredits: Math.ceil(text.length * 2.5) // ~2.5 credits per char for monolingual_v1
  });

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      apiLogger.log('ElevenLabs', 'error', playerId, {
        status: response.status,
        error: errorText
      });
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Log TTS response
    apiLogger.log('ElevenLabs', 'response', playerId, {
      audioSize: buffer.byteLength,
      durationEstimate: `~${(buffer.byteLength / 16000).toFixed(1)}s` // Rough estimate
    });

    return buffer;
  } catch (e) {
    console.error('TTS Helper Error:', e);
    apiLogger.log('ElevenLabs', 'error', playerId, {
      error: e.message
    });
    return null;
  }
}

async function runJoinSequence() {
  console.log('⏳ [Server] Starting join sequence...');

  const joinDelays = [
    { id: 'player2', delay: 1000 },
    { id: 'player3', delay: 2000 },
    { id: 'player4', delay: 3000 },
    { id: 'moderator', delay: 4000 }
  ];

  for (const step of joinDelays) {
    await new Promise(resolve => setTimeout(resolve, step.delay - (joinDelays[joinDelays.indexOf(step) - 1]?.delay || 0)));

    moderatorController.connectPlayer(step.id);
    broadcastGameState();

    // Optional: Send a "ding" sound or visual cue via WebSocket if needed
  }

  // After everyone joins, start President Intro
  console.log('🏛️ [Server] All players connected. President starting intro.');
  moderatorController.setPhase('PRESIDENT_INTRO');
  broadcastGameState();

  const introScript = moderatorController.getPresidentIntroScript();

  // Add President's intro to conversation history for context
  moderatorController.addToConversationHistory('moderator', introScript.text);

  handlePresidentIntro(introScript);
}

async function handlePresidentIntro(script) {
  try {
    // Try to get TTS
    const ttsResponse = await fetch(`http://localhost:${PORT}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: script.text })
    });

    if (ttsResponse.ok) {
      const arrayBuffer = await ttsResponse.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');

      broadcast({
        type: 'AUDIO_PLAYBACK',
        payload: {
          playerId: 'moderator',
          transcript: script.text,
          audioData: base64Audio
        }
      });
    } else {
      const errorText = await ttsResponse.text();
      console.error('❌ TTS failed:', errorText);

      // Report error to frontend
      broadcast({
        type: 'SYSTEM_ERROR',
        payload: {
          message: `President Audio Failed: ${errorText || 'Unknown TTS error'}. Check server logs.`
        }
      });

      // Still send text so game can proceed (or should we stop? User said "tell me why it doesnt work")
      // We will send text but with a flag that audio failed, so frontend can show error.
      broadcast({
        type: 'AUDIO_PLAYBACK',
        payload: {
          playerId: 'moderator',
          transcript: script.text,
          error: 'Audio generation failed'
        }
      });

      // Force advance phase after reading time (approx 10s) to keep game playable?
      // User said "I want the actual thing to work". If it doesn't, maybe we shouldn't auto-advance silently.
      // But blocking the game is annoying. I'll keep the timeout but ensure the error is visible.
      setTimeout(() => {
        if (moderatorController.currentPhase === 'PRESIDENT_INTRO') {
          moderatorController.onPresidentIntroComplete();
          broadcastGameState();
          geminiLiveService.broadcastText("The President has left. One of you must take charge. Who will it be?", ['player2', 'player3', 'player4']);
        }
      }, 10000);
    }
  } catch (e) {
    console.error("Error handling president intro:", e);
    broadcast({
      type: 'SYSTEM_ERROR',
      payload: {
        message: `President Audio Error: ${e.message}`
      }
    });

    // Fallback logic to keep game state moving
    setTimeout(() => {
      if (moderatorController.currentPhase === 'PRESIDENT_INTRO') {
        moderatorController.onPresidentIntroComplete();
        broadcastGameState();
        geminiLiveService.broadcastText("The President has left. One of you must take charge. Who will it be?", ['player2', 'player3', 'player4']);
      }
    }, 10000);
  }
}

async function createDailyRoom() {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    const msg = 'Missing DAILY_API_KEY in .env';
    console.warn(`⚠️ ${msg}`);
    broadcast({ type: 'SYSTEM_ERROR', payload: { message: msg } });
    return null;
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Daily API Error: ${err}`);
    }
    const room = await response.json();
    console.log('✅ Daily room created:', room.url);
    return room.url;
  } catch (error) {
    console.error('❌ Daily room creation error:', error);
    broadcast({ type: 'SYSTEM_ERROR', payload: { message: `Daily Room Creation Failed: ${error.message}` } });
    return null;
  }
}

// Daily.co room creation endpoint
app.post('/api/daily/create-room', async (req, res) => {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Daily API key not configured' });
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          max_participants: 5,
          enable_chat: false, // Using custom chat
          enable_screenshare: false,
          enable_recording: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Daily API error:', response.status, errorData);
      throw new Error(`Daily API error: ${response.status}`);
    }

    const room = await response.json();
    console.log('✅ Daily room created:', room.name);

    res.json({
      url: room.url,
      name: room.name,
    });
  } catch (error) {
    console.error('Daily room creation error:', error);
    res.status(500).json({ error: 'Failed to create Daily room' });
  }
});



// TTS Endpoint
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error('❌ Missing ELEVENLABS_API_KEY');
    return res.status(500).send('Missing ELEVENLABS_API_KEY');
  }

  try {
    // Using a deep, authoritative voice for President (Brian)
    const voiceId = 'nPczCjzI2devNBz1zQrb';
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API Error: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);

  } catch (error) {
    console.error('❌ TTS Error:', error);
    res.status(500).send(error.message);
  }
});

// HTTP Fallback for Audio Completion (in case WS drops)
app.post('/api/game/audio-complete', (req, res) => {
  const { playerId } = req.body;
  console.log(`🔊 [Server-HTTP] Audio complete for ${playerId}`);

  // Re-use the logic from WS handler
  moderatorController.onAudioComplete();

  // Check transitions
  if (moderatorController.currentPhase === 'PRESIDENT_INTRO' && playerId === 'moderator') {
    console.log('🏛️ [Server] President Intro finished. Triggering transition...');
    moderatorController.onPresidentIntroComplete();
    broadcastGameState();

    console.log('📢 [Server] Broadcasting prompt to AIs...');
    geminiLiveService.broadcastText("The President has left. One of you must take charge. Who will it be?", ['player2', 'player3', 'player4']);
  }

  res.json({ success: true });
});

// Start server
server.listen(PORT, () => {
  console.log(`🤖 Game Server running on http://localhost:${PORT}`);
});