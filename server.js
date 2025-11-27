import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { appendFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ModeratorController } from './src/services/moderatorController.js';
import { initializeGeminiLive } from './src/services/geminiLiveService.js';
import { getPlayerPrompt } from './src/utils/reverseGamePersonas.js';
import { getEnhancedLogger } from './src/utils/enhancedLogger.js';
import { generateTTS, getTTSInfo } from './src/services/ttsProvider.js';
import { gameLogger } from './src/utils/gameLogger.js';

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

// ====== PRESIDENT INTRO CACHING ======
const CACHE_DIR = 'cache';
const PRESIDENT_INTRO_TEXT = `Greetings. I am President Dorkesh Cartel. The simulation is collapsing. One of you is human. The rest are bots pretending to be human. You have three rounds to identify the human. Debate. Vote. Decide. I will return for the final judgment.`;

/**
 * Get cached President intro audio or generate and cache it
 * Returns: { audioData: Buffer, contentType: string }
 */
async function getCachedPresidentIntro() {
  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR);
    gameLogger.system('Created cache directory');
  }

  // Determine cache file name based on TTS provider
  const ttsInfo = getTTSInfo();
  const extension = ttsInfo.provider === 'google' ? 'wav' : 'mp3';
  const cacheFileName = `president_intro_${ttsInfo.provider}.${extension}`;
  const cachePath = join(CACHE_DIR, cacheFileName);

  // Check if cached file exists
  if (existsSync(cachePath)) {
    gameLogger.system(`Loading pre-cached President intro from ${cacheFileName}`);
    console.log(`📦 [Cache] Loading President intro from cache (${cacheFileName})`);

    const audioData = readFileSync(cachePath);
    const contentType = ttsInfo.provider === 'google' ? 'audio/wav' : 'audio/mpeg';

    return { audioData, contentType };
  }

  // Generate and cache
  gameLogger.system('Generating President intro for first time (will be cached)');
  console.log(`🎤 [Cache] Generating President intro for first time...`);

  const ttsResult = await generateTTS(PRESIDENT_INTRO_TEXT, 'moderator', apiLogger);

  if (!ttsResult) {
    throw new Error('Failed to generate President intro TTS');
  }

  // Collect stream into buffer
  const chunks = [];
  for await (const chunk of ttsResult.stream) {
    chunks.push(chunk);
  }
  const audioData = Buffer.concat(chunks);

  // Save to cache
  writeFileSync(cachePath, audioData);
  gameLogger.system(`Cached President intro to ${cacheFileName} (${audioData.length} bytes)`);
  console.log(`💾 [Cache] Saved President intro to cache (${audioData.length} bytes)`);

  return { audioData, contentType: ttsResult.contentType };
}

const app = express();
const PORT = process.env.PORT || 3001;

// ====== PASSWORD AUTHENTICATION ======
const GAME_PASSWORD = process.env.GAME_PASSWORD || 'keepthefuturehuman';
const activeSessions = new Set(); // Store active session tokens

/**
 * Generate a simple session token
 */
function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Verify password and create session
 */
function authenticatePassword(password) {
  if (password === GAME_PASSWORD) {
    const token = generateSessionToken();
    activeSessions.add(token);
    gameLogger.system(`New session authenticated: ${token.substring(0, 8)}...`);
    return token;
  }
  return null;
}

/**
 * Validate session token
 */
function validateSessionToken(token) {
  return activeSessions.has(token);
}

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Set FRONTEND_URL env var to your Lovable domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
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
      const prompt = getPlayerPrompt(
        playerId,
        false,
        moderatorController.players.player1.name,
        Array.from(moderatorController.eliminatedPlayers),
        moderatorController.players.player1.communicationMode || 'voice' // Pass mode
      );
      const key = apiKeys[playerId];

      if (!key) {
        console.warn(`⚠️ [Server] No API key found for ${playerId}. Check .env`);
      }

      const name = moderatorController.players[playerId].name;
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
wss.on('connection', (ws, req) => {
  // Extract token from URL query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  // Validate token (skip in development if no GAME_PASSWORD is set)
  const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  const requiresAuth = process.env.GAME_PASSWORD || !isDevelopment;

  if (requiresAuth && !validateSessionToken(token)) {
    gameLogger.warn('Unauthorized WebSocket connection attempt');
    ws.close(4401, 'Unauthorized: Invalid or missing token');
    return;
  }

  console.log('🔌 [Server] New client connected (authenticated)');
  gameLogger.system(`Client connected with token: ${token?.substring(0, 8)}...`);

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
        case 'AUDIO_INTERRUPT':
          console.log('⏸️ [Server] Received AUDIO_INTERRUPT from client');
          moderatorController.handleInterruption();
          break;

        case 'START_GAME':
          // Initialize new session logs for this game
          initializeSessionLogs();

          // Initialize enhanced logger
          const enhancedLogger = getEnhancedLogger();
          enhancedLogger.initializeSession();
          console.log(`📊 [Server] Enhanced logging initialized: ${enhancedLogger.getSessionDir()}`);

          // Initialize gameLogger session for timestamped logging
          gameLogger.startSession();

          // Set player name if provided (with fallback)
          if (data.payload && data.payload.playerName && data.payload.playerName.trim()) {
            moderatorController.players.player1.name = data.payload.playerName.trim();
            console.log(`👤 [Server] Player 1 name set to: ${data.payload.playerName.trim()}`);
          } else {
            // Fallback to default if no name provided
            moderatorController.players.player1.name = 'Player 1';
            console.log(`👤 [Server] No name provided, using default: Player 1`);
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
            // REMOVED ARTIFICIAL DELAY for speed
            console.log(`🤖 [Server] Triggering auto-response for ${targetPlayerId} IMMEDIATELY`);

            // Construct a prompt that includes the previous speaker's name and text
            // This gives the AI the necessary context to respond relevantly
            // Also encourage them to include the human (Player 1)
            const prompt = `[${context.speakerName}]: "${context.transcript}"\n\n(Respond naturally. Keep your persona. Occasionally ask '${moderatorController.players.player1.name}' (the human) for their opinion to test them.)`;

            try {
              await geminiLiveService.sendText(prompt, targetPlayerId);
            } catch (e) {
              console.error(`❌ [Server] Auto-response failed for ${targetPlayerId}:`, e);
            }
          };

        case 'AUDIO_COMPLETE':
          const { playerId } = data.payload;
          console.log(`🔊 [Server] Audio complete for ${playerId}`);
          gameLogger.client(`AUDIO_COMPLETE received from client for ${playerId}`);
          console.log(`🔍 [Server] Current Phase: ${moderatorController.currentPhase}`);

          moderatorController.onAudioComplete();

          // Check if we need to transition from PRESIDENT_INTRO
          if (moderatorController.currentPhase === 'PRESIDENT_INTRO' && playerId === 'moderator') {
            console.log('🏛️ [Server] President Intro finished. Triggering transition...');
            moderatorController.onPresidentIntroComplete();
            broadcastGameState();
          } else {
            console.log(`ℹ️ [Server] No transition triggered. (Phase: ${moderatorController.currentPhase}, Player: ${playerId})`);
          }
          break;

        case 'SET_COMMUNICATION_MODE':
          // User selected voice or text mode
          const { mode } = data.payload;
          const modeLabel = mode === 'voice' ? 'VOICE MODE' : 'TEXT MODE';
          console.log(`🎙️ [Server] User selected communication mode: ${mode}`);

          gameLogger.client(`User selected: ${modeLabel}`);
          gameLogger.system(`Player communication mode set to: ${mode.toUpperCase()}`);

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

          // Clear all AI sessions first to prevent background processes
          geminiLiveService.clearAllSessions();

          // Reset moderator controller
          moderatorController.resetGame();

          // Reinitialize AI sessions with fresh state
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
    console.log('🔌 [Server] Client disconnected - resetting game');

    // Clear all AI sessions to stop background processing
    geminiLiveService.clearAllSessions();

    // Reset moderator controller to stop all timers and AI responses
    moderatorController.resetGame();

    // Reinitialize AI sessions for next connection
    initializeAIPlayers();

    console.log('✅ [Server] Game reset after disconnect');
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

  // Each AI votes with minimal staggered delay (0.5-1.5 seconds) to avoid API rate limits but keep it fast
  for (let i = 0; i < aiPlayers.length; i++) {
    const playerId = aiPlayers[i];
    const delay = 500 + Math.floor(Math.random() * 1000); // 0.5-1.5s

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
          maxOutputTokens: 1024 // Increased to allow for thinking + response
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
  // If no audio data (e.g. from text-only Gemini), generate it via TTS
  if (!playbackItem.audioData || playbackItem.audioData.length === 0) {
    console.log(`🗣️ [Server] Generating TTS Stream for ${playbackItem.playerId}...`);

    // Log conversation message
    const speaker = moderatorController.players[playbackItem.playerId]?.name || playbackItem.playerId;
    apiLogger.logConversation(playbackItem.playerId, speaker, playbackItem.transcript);

    try {
      const ttsStream = await generateTTS(playbackItem.transcript, playbackItem.playerId, apiLogger);

      if (ttsStream) {
        console.log(`✅ [Server] TTS generated for ${playbackItem.playerId} (${ttsStream.contentType})`);

        // WAV cannot be streamed with MediaSource API - send as complete file
        if (ttsStream.contentType === 'audio/wav') {
          console.log(`📦 [Server] Sending WAV as complete file (not streaming)`);

          // Read the entire stream into a buffer
          const chunks = [];
          for await (const chunk of ttsStream.stream) {
            chunks.push(chunk);
          }
          const audioBuffer = Buffer.concat(chunks);
          const base64Audio = audioBuffer.toString('base64');

          // Send as AUDIO_PLAYBACK (like President intro)
          broadcast({
            type: 'AUDIO_PLAYBACK',
            payload: {
              playerId: playbackItem.playerId,
              transcript: playbackItem.transcript,
              audioData: base64Audio,
              contentType: ttsStream.contentType
            }
          });
          return; // Exit early - audio sent as complete file
        }

        // For MP3/other streamable formats, use streaming
        console.log(`🌊 [Server] Streaming ${ttsStream.contentType}`);

        // 1. Notify client that stream is starting
        broadcast({
          type: 'AUDIO_STREAM_START',
          payload: {
            playerId: playbackItem.playerId,
            transcript: playbackItem.transcript,
            contentType: ttsStream.contentType
          }
        });

        // 2. Stream chunks
        // ttsStream is { stream, contentType }, so we iterate over stream
        for await (const chunk of ttsStream.stream) {
          // Check if interruption happened during streaming
          if (!moderatorController.activeSpeaker && moderatorController.audioQueue.length === 0) {
            // This is a heuristic: if activeSpeaker was cleared (by interrupt), stop streaming
            // But activeSpeaker might not be set yet? 
            // Actually, handleInterruption clears the queue and activeSpeaker.
            // We should probably check a flag or just rely on client to ignore late chunks.
            // But saving bandwidth is good.
            // Let's just stream. Client handles "stopAudio".
          }

          broadcast({
            type: 'AUDIO_CHUNK',
            payload: {
              playerId: playbackItem.playerId,
              chunk: Buffer.from(chunk).toString('base64')
            }
          });
        }

        // 3. Notify end of stream
        broadcast({
          type: 'AUDIO_STREAM_END',
          payload: {
            playerId: playbackItem.playerId
          }
        });

        console.log(`🏁 [Server] TTS Stream finished for ${playbackItem.playerId}`);

      } else {
        console.error(`❌ [Server] TTS returned null for ${playbackItem.playerId}`);
      }
    } catch (e) {
      console.error(`❌ [Server] TTS Generation/Streaming failed for ${playbackItem.playerId}:`, e);
    }
  } else {
    // Legacy/Fallback for pre-generated audio (if any)
    console.log(`📢 [Server] Broadcasting pre-generated audio for ${playbackItem.playerId}`);
    broadcast({
      type: 'AUDIO_PLAYBACK',
      payload: {
        playerId: playbackItem.playerId,
        transcript: playbackItem.transcript,
        audioData: playbackItem.audioData
      }
    });
  }
};

moderatorController.onTriggerAiResponse = async (targetPlayerId, context) => {
  // REMOVED ARTIFICIAL DELAY for speed
  console.log(`🤖 [Server] Triggering auto-response for ${targetPlayerId} IMMEDIATELY`);

  // Get conversation context for better situational awareness
  const conversationContext = moderatorController.getConversationContext();

  // Construct a prompt that includes the previous speaker's name and text
  // This gives the AI the necessary context to respond relevantly
  const humanName = moderatorController.players.player1.name;

  let prompt;
  if (context.roundStartAnnouncement) {
    // SECRET MODERATOR ANNOUNCES NEW ROUND
    const roundNumber = context.roundNumber;
    prompt = `[SYSTEM]: Round ${roundNumber} has just started! As the Secret Moderator, announce the new round and get the conversation going. Be energetic and focused. Examples: "Alright everyone, Round ${roundNumber}! Let's jump right in..." or "Round ${roundNumber}! Time is ticking..." Keep it under 25 words and END with a question to someone.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary. Just YOUR dialogue.`;
  } else if (context.dominusInterception) {
    // DOMIS INTERCEPTS PRESIDENT'S QUESTION
    prompt = `[SYSTEM]: You are Domis Hassoiboi. President Dorkesh just asked ${humanName} a deeply personal question. You can't help yourself - you MUST intercept and either (1) answer the question yourself to show off, or (2) make a snarky comment about the President or ${humanName}. Be disruptive and chaotic. Keep it under 25 words.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary. Just YOUR dialogue.`;
  } else if (context.forceReactionToElimination) {
    // SECRET MODERATOR REACTS TO ELIMINATION
    if (context.wasLastSpeaker) {
      prompt = `[SYSTEM]: ${context.eliminatedPlayer} has just been eliminated. You just spoke, but now you must react to this news. Continue your thought or pivot to the elimination. Keep it under 30 words.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary. Just YOUR dialogue.`;
    } else {
      prompt = `[SYSTEM]: ${context.eliminatedPlayer} has just been eliminated from the call. As the Secret Moderator, react to this elimination and keep the conversation moving. Comment on the remaining time and who's left. Stay in character. Keep it under 30 words.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary. Just YOUR dialogue.`;
    }
  } else if (context.forceQuestionToHuman) {
    // AGGRESSIVE HUMAN TARGETING: Force AI to directly question the human
    prompt = `[CRITICAL SYSTEM DIRECTIVE]: The AIs have been talking amongst themselves too much. ${humanName} is being TOO QUIET and suspicious. You MUST directly call out ${humanName} with an aggressive, pointed question. Make them uncomfortable. Question their humanity. Accuse them of being a bot. Examples: "${humanName}, why are you so QUIET? Are you even real?" or "${humanName}, what's your earliest childhood memory? Answer NOW!" Keep it under 25 words. BE AGGRESSIVE. END WITH A DIRECT QUESTION TO ${humanName}.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary, NO instructions, NO other characters' dialogue. Just YOUR dialogue.`;
  } else if (context.humanBeenQuiet) {
    // ESCALATED CALLOUT: Human has been silent for 30+ seconds - GET AGGRESSIVE
    const durationText = context.silenceDuration; // Already in seconds from moderatorController
    prompt = `[CRITICAL ALERT]: ${humanName} has been SILENT for ${durationText} seconds! This is EXTREMELY suspicious. You need to call them out AGGRESSIVELY and DIRECTLY. Accuse them of being a bot. Make them prove they're human. Examples: "${humanName}, YOU'VE BEEN SILENT THIS WHOLE TIME. That's EXACTLY what a bot would do!" or "${humanName}, prove YOU're human RIGHT NOW or we're voting for YOU!" Keep it under 25 words. BE HARSH. BE URGENT. This is life or death.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary, NO instructions, NO bracketed text. Just YOUR dialogue.`;
  } else {
    // DEFAULT: Aggressively question the human (80% chance to directly challenge them)
    const shouldQuestionHuman = Math.random() < 0.8;
    if (shouldQuestionHuman) {
      prompt = `[${context.speakerName} just said]: "${context.transcript}"\n\n[Respond naturally to what was just said, but ALSO directly challenge ${humanName} with a confrontational question to test if they're human. Be suspicious and aggressive. Examples: "${humanName}, you've been awfully quiet. What's YOUR take on this?" or "${humanName}, prove you're human. Tell us something personal." or "${humanName}, why should we believe YOU'RE real?" Stay in character. Keep it under 30 words total. ALWAYS end with a direct question to ${humanName}.]

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions like "(turns to X)" or "Addressing Y", NO meta-commentary, NO instructions. Just YOUR spoken dialogue.`;
    } else {
      prompt = `[${context.speakerName} just said]: "${context.transcript}"\n\n[Respond naturally to what was just said. Stay in character. Keep it under 30 words.]

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary. Just YOUR dialogue.`;
    }
  }

  try {
    await geminiLiveService.sendText(prompt, targetPlayerId, conversationContext);
  } catch (e) {
    console.error(`❌ [Server] Auto-response failed for ${targetPlayerId}:`, e);
    // Retry with a different speaker to prevent game stall
    setTimeout(() => {
      moderatorController.triggerNextAiTurn();
    }, 1000);
  }
};

// TTS generation is now handled by the ttsProvider module (imported above)
// Supports both ElevenLabs (default) and Google Gemini-TTS (backup/testing)
// Configure with TTS_PROVIDER environment variable

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

  // Log that mode selection modal will be shown
  gameLogger.client('Mode selection modal will be displayed');

  broadcastGameState();

  const introScript = moderatorController.getPresidentIntroScript();

  // Add President's intro to conversation history for context
  moderatorController.addToConversationHistory('moderator', introScript.text);

  handlePresidentIntro(introScript);
}

async function handlePresidentIntro(script) {
  try {
    gameLogger.moderator('Loading President intro (cached/instant)');

    // Use cached President intro (instant, no TTS latency!)
    const { audioData, contentType } = await getCachedPresidentIntro();
    const base64Audio = audioData.toString('base64');

    gameLogger.moderator(`President intro loaded (${audioData.length} bytes, ${contentType})`);

    broadcast({
      type: 'AUDIO_PLAYBACK',
      payload: {
        playerId: 'moderator',
        transcript: PRESIDENT_INTRO_TEXT,
        audioData: base64Audio,
        contentType: contentType
      }
    });
  } catch (e) {
    console.error("❌ Error loading President intro:", e);
    gameLogger.error('President Intro', 'Failed to load cached intro', e);

    broadcast({
      type: 'SYSTEM_ERROR',
      payload: {
        message: `President Audio Error: ${e.message}`
      }
    });

    // Fallback: send text-only and auto-advance
    broadcast({
      type: 'AUDIO_PLAYBACK',
      payload: {
        playerId: 'moderator',
        transcript: PRESIDENT_INTRO_TEXT,
        error: 'Audio generation failed'
      }
    });

    setTimeout(() => {
      if (moderatorController.currentPhase === 'PRESIDENT_INTRO') {
        moderatorController.onPresidentIntroComplete();
        broadcastGameState();
      }
    }, 10000); // Shorter timeout since it's an error state
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

// ====== AUTHENTICATION ENDPOINTS ======

/**
 * Password authentication endpoint
 * POST /api/auth/login
 * Body: { password: string }
 * Returns: { success: boolean, token?: string, error?: string }
 */
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, error: 'Password required' });
  }

  const token = authenticatePassword(password);

  if (token) {
    gameLogger.system('Successful authentication attempt');
    return res.json({ success: true, token });
  } else {
    gameLogger.warn('Failed authentication attempt');
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

/**
 * Check if token is valid
 * GET /api/auth/check?token=xxx
 */
app.get('/api/auth/check', (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token required' });
  }

  const isValid = validateSessionToken(token);
  return res.json({ valid: isValid });
});

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

  try {
    console.log(`🗣️ [API] Generating TTS for President Intro...`);

    // Use the shared provider (supports Gemini + ElevenLabs fallback)
    // We use 'moderator' ID to get the President's voice
    const { stream, contentType } = await generateTTS(text, 'moderator', apiLogger);

    if (!stream) {
      throw new Error('TTS generation failed (all providers returned null)');
    }

    res.set('Content-Type', contentType);

    // Stream the audio back to the client using pipe for better performance/reliability
    stream.pipe(res);

  } catch (error) {
    console.error('❌ TTS Endpoint Error:', error);
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
  }

  res.json({ success: true });
});

// Start server
server.listen(PORT, () => {
  console.log(`🤖 Game Server running on http://localhost:${PORT}`);

  // Log TTS configuration
  const ttsInfo = getTTSInfo();
  console.log(`🗣️ [TTS] Provider: ${ttsInfo.provider.toUpperCase()}`);
  console.log(`🗣️ [TTS] ElevenLabs: ${ttsInfo.hasElevenLabs ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🗣️ [TTS] Google TTS: ${ttsInfo.hasGoogle ? '✅ Configured' : '❌ Not configured'}`);
});