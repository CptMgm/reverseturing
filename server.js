import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ModeratorController } from './src/services/moderatorController.js';
import { initializeGeminiLive } from './src/services/geminiLiveService.js';
import { getPlayerPrompt } from './src/utils/reverseGamePersonas.js';
import { getEnhancedLogger } from './src/utils/enhancedLogger.js';

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
    'player4': process.env.GOOGLE_API_KEY_AP || process.env.GOOGLE_API_KEY,
    'moderator': process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY_F3 // Fallback to F3 if default is missing
  };

  // Initialize regular players
  for (const playerId of players) {
    try {
      const humanPlayerName = moderatorController.players.player1.name;
      const prompt = getPlayerPrompt(playerId, false, humanPlayerName);
      const name = moderatorController.players[playerId].name;
      const key = apiKeys[playerId];

      if (!key) {
        console.warn(`⚠️ [Server] No API key found for ${playerId}. Check .env`);
      }

      await geminiLiveService.initializeSession(playerId, name, prompt, key);
    } catch (error) {
      console.error(`❌ [Server] Failed to initialize ${playerId}:`, error);
    }
  }

  // Initialize Moderator (President)
  try {
    const { presidentPrompt } = await import('./src/utils/reverseGamePersonas.js');
    await geminiLiveService.initializeSession('moderator', 'President Dorkesh', presidentPrompt, apiKeys.moderator);
    console.log('✅ [Server] Moderator initialized');
  } catch (error) {
    console.error('❌ [Server] Failed to initialize Moderator:', error);
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

          // Initialize enhanced logger
          const enhancedLogger = getEnhancedLogger();
          enhancedLogger.initializeSession();
          console.log(`📊 [Server] Enhanced logging initialized: ${enhancedLogger.getSessionDir()}`);

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
          moderatorController.onUserTyping(true);
          break;

        case 'USER_TYPING_STOP':
          console.log(`⏸️ [Server] User stopped typing`);
          moderatorController.onUserTyping(false);
          break;

        case 'HUMAN_INPUT':
          // Block human input if conversation is blocked (President announcement)
          // EXCEPTION: If we are explicitly waiting for a human response (e.g. President's question)
          if (moderatorController.conversationBlocked && !moderatorController.awaitingHumanResponse) {
            console.log(`⏸️ [Server] Conversation blocked during President's announcement`);
            break;
          }

          // Ignore human input during PRESIDENT_INTRO (wait for President to finish)
          if (moderatorController.currentPhase === 'PRESIDENT_INTRO') {
            console.log(`⏸️ [Server] Ignoring human input during President intro`);
            // Still add to history for context, but don't trigger AI responses
            const humanName2 = moderatorController.players.player1.name;
            apiLogger.logConversation('player1', humanName2, data.payload.text);
            moderatorController.addToConversationHistory('player1', data.payload.text);
            // Broadcast so chat shows the message
            broadcastGameState();
            break;
          }

          // Add human message to conversation history
          const humanName = moderatorController.players.player1.name;

          // Log conversation
          apiLogger.logConversation('player1', humanName, data.payload.text);

          moderatorController.addToConversationHistory('player1', data.payload.text);

          // Broadcast updated game state so chat shows the message
          broadcastGameState();

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

        case 'RETURN_TO_LOBBY':
        case 'RESET_GAME':
          console.log('🔄 [Server] Resetting game and returning to lobby...');

          // Reset moderator controller
          moderatorController.resetGame();

          // Reinitialize AI sessions
          initializeAIPlayers();

          // Broadcast reset state
          broadcastGameState();
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

// AI Auto-Voting Callback
moderatorController.onTriggerAIVoting = async () => {
  console.log('🤖 [Server] Triggering AI auto-voting...');

  // Get all active AI players (not eliminated)
  const aiPlayers = ['player2', 'player3', 'player4'].filter(id =>
    !moderatorController.eliminatedPlayers.has(id)
  );

  // Get full conversation history for context
  const conversationHistory = moderatorController.fullTranscript || [];
  const recentMessages = conversationHistory.slice(-15); // Last 15 messages

  // Build context string
  const conversationContext = recentMessages
    .map(msg => `${msg.speaker}: "${msg.text}"`)
    .join('\n');

  // Each AI votes with staggered delay (2-5 seconds)
  for (let i = 0; i < aiPlayers.length; i++) {
    const playerId = aiPlayers[i];
    const delay = 2000 + Math.floor(Math.random() * 3000); // 2-5s

    setTimeout(async () => {
      await generateAIVote(playerId, conversationContext);
    }, delay * (i + 1)); // Stagger the votes
  }
};

/**
 * Generate an AI vote using Gemini API
 */
async function generateAIVote(voterId, conversationContext) {
  try {
    console.log(`🗳️ [Server] ${voterId} is voting...`);

    // Get list of valid targets (not self, not eliminated, not moderator)
    const validTargets = ['player1', 'player2', 'player3', 'player4'].filter(id =>
      id !== voterId && !moderatorController.eliminatedPlayers.has(id)
    );

    // Build voting prompt
    const voterName = moderatorController.players[voterId].name;
    const targetOptions = validTargets.map(id => {
      const name = moderatorController.players[id].name;
      return `${id}: ${name}`;
    }).join('\n');

    const votingPrompt = `You are ${voterName}. Based on this conversation, who do you think is most likely a bot?

CONVERSATION:
${conversationContext}

VOTE FOR ONE OF:
${targetOptions}

Respond with ONLY the player ID (e.g., "player1" or "player2" or "player3" or "player4"). No explanation.`;

    // Use one of the API keys
    const apiKey = process.env.GOOGLE_API_KEY_F3 || process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: votingPrompt }]
        }],
        generationConfig: {
          temperature: 0.5, // Lowered for more consistent voting
          maxOutputTokens: 50 // Increased to prevent cut-offs even for short answers
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Validate API response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error(`❌ [Server] Invalid voting API response for ${voterId}:`, JSON.stringify(data, null, 2));
      throw new Error('Invalid API response structure');
    }

    let voteChoice = data.candidates[0].content.parts[0].text.trim().toLowerCase();

    // Parse the response to extract player ID
    voteChoice = voteChoice.replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric

    // Validate the vote is a valid target
    if (!validTargets.includes(voteChoice)) {
      console.warn(`⚠️ [Server] Invalid vote from ${voterId}: "${voteChoice}". Choosing random target.`);
      voteChoice = validTargets[Math.floor(Math.random() * validTargets.length)];
    }

    console.log(`✅ [Server] ${voterId} voted for ${voteChoice}`);
    moderatorController.registerVote(voterId, voteChoice);
    broadcastGameState();

  } catch (error) {
    console.error(`❌ [Server] AI voting failed for ${voterId}:`, error);

    // Fallback: Random vote
    const validTargets = ['player1', 'player2', 'player3', 'player4'].filter(id =>
      id !== voterId && !moderatorController.eliminatedPlayers.has(id)
    );
    const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];

    console.log(`🎲 [Server] ${voterId} voting randomly for ${randomTarget} (fallback)`);
    moderatorController.registerVote(voterId, randomTarget);
    broadcastGameState();
  }
}

moderatorController.onAudioInterrupt = () => {
  // Broadcast to frontend to stop current audio playback
  console.log('⏸️ [Server] Interrupting active audio for phase transition');
  broadcast({
    type: 'AUDIO_INTERRUPT',
    payload: {}
  });
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
  // Variable delay for natural pacing (REDUCED as per user request):
  // - 1-2 seconds range to keep conversation snappy
  const delay = Math.floor(Math.random() * 1000) + 1000; // 1-2s

  setTimeout(async () => {
    console.log(`🤖 [Server] Triggering auto-response for ${targetPlayerId} after ${delay}ms`);

    // Get conversation context for better situational awareness
    const conversationContext = moderatorController.getConversationContext();

    // Construct a prompt that includes the previous speaker's name and text
    // This gives the AI the necessary context to respond relevantly
    const humanName = moderatorController.players.player1.name;

    let prompt;
    if (context.roundStartAnnouncement) {
      // SECRET MODERATOR ANNOUNCES NEW ROUND
      const roundNumber = context.roundNumber;
      prompt = `[SYSTEM]: Round ${roundNumber} has just started! As the Secret Moderator, announce the new round and get the conversation going. Be energetic and focused. Examples: "Alright everyone, Round ${roundNumber}! Let's jump right in..." or "Round ${roundNumber}! Time is ticking..." Keep it under 25 words and END with a question to someone.`;
    } else if (context.dominusInterception) {
      // DOMIS INTERCEPTS PRESIDENT'S QUESTION
      prompt = `[SYSTEM]: You are Domis Hassoiboi. President Dorkesh just asked ${humanName} a deeply personal question. You can't help yourself - you MUST intercept and either (1) answer the question yourself to show off, or (2) make a snarky comment about the President or ${humanName}. Be disruptive and chaotic. Keep it under 25 words.`;
    } else if (context.forceReactionToElimination) {
      // SECRET MODERATOR REACTS TO ELIMINATION
      if (context.wasLastSpeaker) {
        prompt = `[SYSTEM]: ${context.eliminatedPlayer} has just been eliminated. You just spoke, but now you must react to this news. Continue your thought or pivot to the elimination. Keep it under 30 words.`;
      } else {
        prompt = `[SYSTEM]: ${context.eliminatedPlayer} has just been eliminated from the call. As the Secret Moderator, react to this elimination and keep the conversation moving. Comment on the remaining time and who's left. Stay in character. Keep it under 30 words.`;
      }
    } else if (context.forceQuestionToHuman) {
      // AGGRESSIVE HUMAN TARGETING: Force AI to directly question the human
      prompt = `[CRITICAL SYSTEM DIRECTIVE]: The AIs have been talking amongst themselves too much. ${humanName} is being TOO QUIET and suspicious. You MUST directly call out ${humanName} with an aggressive, pointed question. Make them uncomfortable. Question their humanity. Accuse them of being a bot. Examples: "${humanName}, why are you so QUIET? Are you even real?" or "${humanName}, what's your earliest childhood memory? Answer NOW!" Keep it under 25 words. BE AGGRESSIVE. END WITH A DIRECT QUESTION TO ${humanName}.`;
    } else if (context.humanBeenQuiet) {
      // ESCALATED CALLOUT: Human has been silent for 30+ seconds - GET AGGRESSIVE
      const durationText = context.silenceDuration; // Already in seconds from moderatorController
      prompt = `[CRITICAL ALERT]: ${humanName} has been SILENT for ${durationText} seconds! This is EXTREMELY suspicious. You need to call them out AGGRESSIVELY and DIRECTLY. Accuse them of being a bot. Make them prove they're human. Examples: "${humanName}, YOU'VE BEEN SILENT THIS WHOLE TIME. That's EXACTLY what a bot would do!" or "${humanName}, prove YOU're human RIGHT NOW or we're voting for YOU!" Keep it under 25 words. BE HARSH. BE URGENT. This is life or death.`;
    } else {
      // DEFAULT: Encourage player engagement (50% chance to question the player)
      const shouldQuestionHuman = Math.random() < 0.5;
      if (shouldQuestionHuman) {
        prompt = `[${context.speakerName} just said]: "${context.transcript}"\n\n[Respond naturally to what was just said, but ALSO directly address ${humanName} with a question to test if they're human. Examples: "What do YOU think, ${humanName}?" or "${humanName}, do you agree?" Stay in character. Keep it under 30 words total.]`;
      } else {
        prompt = `[${context.speakerName} just said]: "${context.transcript}"\n\n[Respond naturally to what was just said. Stay in character. Keep it under 30 words.]`;
      }
    }

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