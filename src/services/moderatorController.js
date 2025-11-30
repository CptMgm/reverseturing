/**
 * Moderator Controller
 *
 * Central state machine for managing the Reverse Turing Test game.
 * Handles game phases, message routing, vote tracking, and audio queue management.
 */

import { getEnhancedLogger } from '../utils/enhancedLogger.js';
import { gameLogger } from '../utils/gameLogger.js';

// Game phases
export const GAME_PHASES = {
  LOBBY: 'LOBBY',               // Waiting for players
  CALL_CONNECTING: 'CALL_CONNECTING', // Players joining the call
  PRESIDENT_INTRO: 'PRESIDENT_INTRO',  // President speaking
  ROUND_1: 'ROUND_1',           // First debate round (4 players)
  ELIMINATION_1: 'ELIMINATION_1', // First voting/elimination
  ROUND_2: 'ROUND_2',           // Second debate round (3 players)
  ELIMINATION_2: 'ELIMINATION_2', // Second voting/elimination
  ROUND_3: 'ROUND_3',           // Final round (2 players + President)
  PRESIDENT_VERDICT: 'PRESIDENT_VERDICT'  // President decides winner
};

export class ModeratorController {
  constructor() {
    // Game state
    this.currentPhase = GAME_PHASES.LOBBY;
    this.secretModeratorId = null;
    this.humanPlayerId = 'player1'; // The actual human

    // Round & Timer state
    this.roundEndTime = null;
    this.roundDuration = 90 * 1000; // 90 seconds
    this.timerInterval = null;
    this.eliminationRevealTime = null; // When elimination reveal countdown ends

    // Connected players (who is in the call)
    this.connectedPlayers = new Set();
    this.eliminatedPlayers = new Set();

    // Vote tracking
    this.votes = {}; // { voterId: targetId }
    this.voteResults = null; // { tally: {}, eliminatedId: null, tie: boolean }

    // Audio queue management (only 1 AI can speak at a time)
    this.activeSpeaker = null;
    this.audioQueue = [];
    this.overlayHoldUntil = null; // Timestamp to hold audio playback until overlay finishes
    this.expectedAudioEndTime = null; // When we expect current audio to finish
    this.audioTimeoutId = null; // Auto-complete timeout ID
    this.audioMaxTimeoutId = null; // 45s max timeout ID

    // Conversation history for context (keep last 8 messages)
    this.conversationHistory = [];
    this.maxHistoryLength = 8;
    this.fullTranscript = []; // Keep full transcript for final verdict

    // Track last 2 speakers to prevent repetition
    this.recentSpeakers = [];

    // Track who was directly asked a question (they MUST respond next)
    this.waitingForResponseFrom = null;
    this.questionAskedAt = null;

    // Message dismissal for simultaneous responses
    this.lastResponseTimestamp = null;
    this.simultaneousResponseWindow = 1000; // Reduced from 2000ms for snappier turns

    // User turn forcing
    this.waitingForUserResponse = false;
    this.userResponseDeadline = null;
    this.userTypingTimer = null;
    this.lastHumanMessageTime = null; // Track when human last spoke for natural participation
    this.humanSilenceWarningIssued = false; // Prevent multiple warnings

    // Smart typing detection
    this.userTypingState = 'idle'; // 'idle' | 'typing' | 'thinking'
    this.userCurrentlySpeaking = false; // Track if user is actively speaking (voice mode)
    this.thinkingTimer = null;
    this.pendingAiTurnTimer = null;
    this.humanResponseDeadlineTimer = null; // Timer for 7-second human response deadline

    // Timing tracking for conversation flow analysis
    this.audioStartTime = null;
    this.lastAudioEndTime = null;

    // Enhanced logger
    this.enhancedLogger = getEnhancedLogger();

    // President Verdict state
    this.conversationBlocked = false; // Block AI responses during President's announcement
    this.awaitingHumanResponse = false; // Waiting for human to answer President's question

    // Callbacks
    this.onPhaseChange = null;
    this.onVoteUpdate = null;
    this.onAudioPlayback = null;
    this.onAudioInterrupt = null; // Callback to stop active audio playback
    this.onPlayerConnectionChange = null;
    this.onSecretModeratorSelected = null;
    this.onTimerUpdate = null;
    this.onPlayerEliminated = null;
    this.onTriggerAIVoting = null; // Callback for AI auto-voting

    // Player info
    this.players = {
      player1: { name: null, isHuman: true, communicationMode: null }, // Will be set when player joins
      player2: { name: 'Wario Amadeuss', isHuman: false },
      player3: { name: 'Domis Has-a-bus', isHuman: false },
      player4: { name: 'Scan Ctrl+Altman', isHuman: false },
      moderator: { name: 'President Dorkesh', isHuman: false }
    };
  }

  /**
   * Set the human player's name
   */
  setPlayerName(name) {
    if (name && name.trim()) {
      this.players.player1.name = name.trim();
      gameLogger.system(`Human player name set to: ${name.trim()}`);
    }
  }

  // ============================================================================
  // SECTION: Game Lifecycle Management
  // ============================================================================

  /**
   * Reset game to initial state
   */
  resetGame() {
    gameLogger.system('Resetting game to lobby...');

    // Reset phase
    this.currentPhase = GAME_PHASES.LOBBY;
    this.secretModeratorId = null;

    // Reset players
    this.connectedPlayers.clear();
    this.eliminatedPlayers.clear();

    // Reset votes
    this.votes = {};

    // Reset audio queue
    this.activeSpeaker = null;
    this.audioQueue = [];
    this.overlayHoldUntil = null;

    // Reset conversation
    this.conversationHistory = [];
    this.fullTranscript = [];
    this.recentSpeakers = [];

    // Reset question tracking
    this.waitingForResponseFrom = null;
    this.questionAskedAt = null;

    // Reset timing
    this.lastResponseTimestamp = null;
    this.lastHumanMessageTime = null;
    this.humanSilenceWarningIssued = false;
    this.audioStartTime = null;
    this.lastAudioEndTime = null;

    // Reset President Verdict state
    this.conversationBlocked = false;
    this.awaitingHumanResponse = false;

    // Reset user interaction
    this.userTypingState = 'idle';
    this.userCurrentlySpeaking = false;

    // Clear ALL timers to prevent background processes
    if (this.thinkingTimer) clearTimeout(this.thinkingTimer);
    if (this.pendingAiTurnTimer) clearTimeout(this.pendingAiTurnTimer);
    if (this.humanResponseDeadlineTimer) clearTimeout(this.humanResponseDeadlineTimer);
    if (this.userTypingTimer) clearTimeout(this.userTypingTimer);
    if (this.audioTimeoutId) clearTimeout(this.audioTimeoutId);
    if (this.audioMaxTimeoutId) clearTimeout(this.audioMaxTimeoutId);

    // Stop timer
    this.stopRoundTimer();
    this.eliminationRevealTime = null;

    gameLogger.system('Game reset complete - all timers cleared');

    // Notify phase change
    if (this.onPhaseChange) {
      this.onPhaseChange(GAME_PHASES.LOBBY);
    }
  }

  startGame() {
    gameLogger.separator('GAME START');
    gameLogger.system('Starting game flow');
    // Reset state
    this.connectedPlayers.clear();
    this.eliminatedPlayers.clear();
    this.connectedPlayers.add('player1'); // Human is always connected first
    this.votes = {};
    this.fullTranscript = [];

    // Initialize human participation tracking
    this.lastHumanMessageTime = Date.now(); // Start tracking from game start
    this.humanSilenceWarningIssued = false;

    this.setPhase(GAME_PHASES.CALL_CONNECTING);

    return null;
  }

  // ============================================================================
  // SECTION: Player Connection & Communication
  // ============================================================================

  /**
   * Set player communication mode (voice/text)
   */
  setCommunicationMode(mode) {
    gameLogger.system(`Setting communication mode to: ${mode}`);
    if (this.players.player1) {
      this.players.player1.communicationMode = mode;
    }

    // Notify AIs of the mode
    // CRITICAL: Do NOT notify AIs during President Intro, or they will interrupt the speech.
    // The onPresidentIntroComplete() method handles the suspicion trigger after the intro finishes.
    if (this.currentPhase === 'PRESIDENT_INTRO') {
      gameLogger.system('Skipping AI notification during President Intro to prevent interruption');
      return;
    }

    const aiPlayers = ['player2', 'player3', 'player4'];
    let systemMsg = "";

    if (mode === 'voice') {
      systemMsg = `[SYSTEM UPDATE]: The human player (Player 1) has connected via VOICE. They are speaking into a microphone. You can HEAR them. Do NOT accuse them of typing or being silent if they are speaking. Treat their voice as their primary input.`;
    } else {
      systemMsg = `[SYSTEM UPDATE]: The human player (Player 1) has connected via TEXT-ONLY. They are NOT using a microphone. This is HIGHLY SUSPICIOUS. Why would a human not speak in a voice call? Accuse them of being a bot hiding behind text.`;
    }

    aiPlayers.forEach(playerId => {
      if (!this.eliminatedPlayers.has(playerId)) {
        // Use sendText to update the AI's context with the system message
        this.geminiService.sendText(systemMsg, playerId).catch(err => {
          gameLogger.error('AI mode update', `Failed to send mode update to ${playerId}`, err);
        });
      }
    });
  }

  /**
   * Connect a player to the call
   */
  connectPlayer(playerId) {
    if (!this.connectedPlayers.has(playerId) && !this.eliminatedPlayers.has(playerId)) {
      gameLogger.player(playerId, 'connected');
      this.connectedPlayers.add(playerId);
      if (this.onPlayerConnectionChange) {
        this.onPlayerConnectionChange(Array.from(this.connectedPlayers));
      }
    }
  }

  /**
   * Disconnect a player from the call
   */
  disconnectPlayer(playerId) {
    if (this.connectedPlayers.has(playerId)) {
      gameLogger.player(playerId, 'disconnected');
      this.connectedPlayers.delete(playerId);
      if (this.onPlayerConnectionChange) {
        this.onPlayerConnectionChange(Array.from(this.connectedPlayers));
      }
    }
  }

  /**
   * Eliminate a player from the game
   */
  eliminatePlayer(playerId) {
    gameLogger.player(playerId, 'ELIMINATED');
    this.eliminatedPlayers.add(playerId);

    // Check if Secret Moderator was eliminated - select new one
    if (playerId === this.secretModeratorId) {
      const remainingAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
      if (remainingAIs.length > 0) {
        const newSecretMod = remainingAIs[0]; // Pick first remaining AI
        this.setSecretModerator(newSecretMod);
        gameLogger.system(`Secret Moderator eliminated! New Secret Moderator: ${this.players[newSecretMod].name} (${newSecretMod})`);
      } else {
        this.secretModeratorId = null;
        gameLogger.warn('No remaining AIs to be Secret Moderator');
      }
    }

    this.disconnectPlayer(playerId);

    const eliminatedName = this.players[playerId]?.name || playerId;

    // Add elimination message to conversation history (shows in chat)
    const eliminationMessage = `${eliminatedName} has been eliminated.`;
    this.addToConversationHistory('system', eliminationMessage);

    // Notify all remaining AIs about the elimination (no immediate reaction)
    const remainingAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));

    if (this.geminiService && remainingAIs.length > 0) {
      this.geminiService.sendSystemNotification(
        remainingAIs,
        `${eliminatedName} has been eliminated from the game. They are no longer in the call. Continue the debate with the remaining players.`
      );

      // NOTE: Secret Moderator will comment on elimination when the NEXT ROUND starts
      // Not here between phases - see startRound2() and startRound3()
    }

    if (this.onPlayerEliminated) {
      this.onPlayerEliminated(playerId);
    }
  }

  // ============================================================================
  // SECTION: Phase & Timer Management
  // ============================================================================

  /**
   * Set current game phase
   */
  setPhase(newPhase) {
    const oldPhase = this.currentPhase;
    gameLogger.phase(oldPhase, newPhase);
    this.currentPhase = newPhase;

    // Set overlay hold for round phases (5.5s overlay + 0.5s delay)
    if (newPhase.startsWith('ROUND_')) {
      this.overlayHoldUntil = Date.now() + 5500; // Hold audio for 5.5s
      gameLogger.system(`Overlay hold set until T+${((this.overlayHoldUntil - gameLogger.sessionStartTime) / 1000).toFixed(1)}s`);

      // ✅ FIX #2a & #9: Reset timing trackers at start of each round
      this.lastAudioEndTime = null;  // Reset silence gap tracker (don't measure from previous round)
      this.audioStartTime = null;
      this.humanSilenceWarningIssued = false;  // Allow new silence warnings in this round
      this.lastHumanMessageTime = Date.now();  // Reset silence timer for this round
      gameLogger.system(`Audio timing reset for ${newPhase}`);
    }

    // Interrupt active audio and clear queue on phase transitions
    if (newPhase.startsWith('ROUND_') || newPhase.startsWith('ELIMINATION_') || newPhase === 'PRESIDENT_VERDICT') {
      gameLogger.system('Interrupting audio and clearing queue for phase transition');
      this.audioQueue = [];

      // Notify frontend to stop current audio playback
      if (this.activeSpeaker && this.onAudioInterrupt) {
        this.onAudioInterrupt();
      }

      this.activeSpeaker = null;
    }

    // Clear votes on phase change
    this.votes = {};
    this.voteResults = null; // Clear previous results
    if (this.onVoteUpdate) this.onVoteUpdate(this.votes);

    // Notify AIs about phase changes
    const activeAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));

    if (this.geminiService && activeAIs.length > 0) {
      if (newPhase === GAME_PHASES.ROUND_1) {
        // Inject visible round marker for AIs FIRST so it appears before any reactions
        this.addToConversationHistory('system', '🔔 ROUND 1 HAS BEGUN. You have 90 seconds to debate and identify the human.');

        this.geminiService.sendSystemNotification(activeAIs, "Round 1 has begun. You have 90 seconds to debate and identify the human.");

        // NOTE: Secret Moderator triggering is handled in onPresidentIntroComplete()
        // which pre-queues the AI DURING the overlay for immediate start
        // Don't trigger here to avoid duplicate responses
      } else if (newPhase === GAME_PHASES.ROUND_2) {
        // Inject visible round marker FIRST
        this.addToConversationHistory('system', '🔔 ROUND 2 HAS BEGUN. One AI has been eliminated. Continue debating to find the human.');

        // Get eliminated player name for context
        const eliminatedId = Array.from(this.eliminatedPlayers)[0];
        const eliminatedName = this.players[eliminatedId]?.name || 'Unknown';

        this.geminiService.sendSystemNotification(activeAIs, `Round 2 has begun. ${eliminatedName} has been eliminated. Comment on how ${eliminatedName} has been eliminated and continue the debate to find the human.`);

        // NOTE: Secret Moderator triggering is handled in startRound2()
        // which pre-queues the AI DURING the overlay for immediate start
        // Don't trigger here to avoid duplicate responses
      } else if (newPhase === GAME_PHASES.ROUND_3) {
        // NOTE: Round 3 setup is handled in startRound3()
        // which is called from resolveElimination()
        // Don't do anything here to avoid duplication
      } else if (newPhase === GAME_PHASES.ELIMINATION_1 || newPhase === GAME_PHASES.ELIMINATION_2) {
        this.geminiService.sendSystemNotification(activeAIs, "Time is up! Voting phase has begun. You must vote to eliminate one player. Think carefully about who seems most like a bot.");
      }
    }

    // Handle Timer for Rounds
    if ([GAME_PHASES.ROUND_1, GAME_PHASES.ROUND_2, GAME_PHASES.ROUND_3].includes(newPhase)) {
      this.startRoundTimer();
    } else {
      this.stopRoundTimer();
    }

    // Trigger Verdict Generation
    if (newPhase === GAME_PHASES.PRESIDENT_VERDICT) {
      this.generateVerdict();
    }

    // Trigger AI Auto-Voting for Elimination Phases
    if (newPhase === GAME_PHASES.ELIMINATION_1 || newPhase === GAME_PHASES.ELIMINATION_2) {
      gameLogger.vote(`Starting AI auto-voting for ${newPhase}`);
      if (this.onTriggerAIVoting) {
        this.onTriggerAIVoting();
      }
    }

    if (this.onPhaseChange) {
      this.onPhaseChange(newPhase);
    }
  }

  startRoundTimer() {
    // Check if overlay is active
    if (this.overlayHoldUntil && Date.now() < this.overlayHoldUntil) {
      const overlayDelay = this.overlayHoldUntil - Date.now();
      gameLogger.system(`Delaying timer start by ${(overlayDelay / 1000).toFixed(1)}s (waiting for overlay to complete)`);

      // Start timer AFTER overlay completes
      setTimeout(() => {
        this.roundEndTime = Date.now() + this.roundDuration;
        gameLogger.system(`Round timer started (AFTER overlay). Ends at T+${((this.roundEndTime - gameLogger.sessionStartTime) / 1000).toFixed(1)}s`);
        this.startTimerInterval();
      }, overlayDelay);
    } else {
      // No overlay active, start immediately
      this.roundEndTime = Date.now() + this.roundDuration;
      gameLogger.system(`Round timer started. Ends at T+${((this.roundEndTime - gameLogger.sessionStartTime) / 1000).toFixed(1)}s`);
      this.startTimerInterval();
    }
  }

  startTimerInterval() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((this.roundEndTime - Date.now()) / 1000));

      if (this.onTimerUpdate) {
        this.onTimerUpdate(remaining);
      }

      if (remaining <= 0) {
        this.onRoundTimeUp();
      }
    }, 1000);
  }

  stopRoundTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.roundEndTime = null;
    if (this.onTimerUpdate) this.onTimerUpdate(0);
  }

  onRoundTimeUp() {
    gameLogger.system('⏰ ROUND TIMER EXPIRED');

    // If AI is speaking, interrupt them
    if (this.activeSpeaker) {
      gameLogger.system(`Interrupting active speaker (${this.activeSpeaker}) - timer expired mid-speech`);
      gameLogger.audio(this.activeSpeaker, `Speech cut off [INTERRUPTED]`);
    }

    this.stopRoundTimer();

    // Play round end sound effect (buzzer)
    // (Frontend will handle this via gameState update)
    // Phase transition will handle clearing queue and interrupting audio (see setPhase())

    // Transition to voting phase
    if (this.currentPhase === GAME_PHASES.ROUND_1) {
      this.setPhase(GAME_PHASES.ELIMINATION_1);
    } else if (this.currentPhase === GAME_PHASES.ROUND_2) {
      this.setPhase(GAME_PHASES.ELIMINATION_2);
    } else if (this.currentPhase === GAME_PHASES.ROUND_3) {
      // After Round 3, President returns for final verdict
      this.connectPlayer('moderator');
      this.setPhase(GAME_PHASES.PRESIDENT_VERDICT);
    }
  }

  // ============================================================================
  // SECTION: Round Start & Intro Handling
  // ============================================================================

  /**
   * Get President's introduction (Dynamic via Gemini now)
   * This is just a fallback/placeholder if Gemini fails
   */
  getPresidentIntroScript() {
    return {
      speaker: 'moderator',
      text: `Greetings. I am President Dorkesh Cartel. I have returned. The simulation is collapsing. Identify the human. Debate. Vote. Decide.`
    };
  }

  /**
   * Called when President finishes intro - start self-organization
   */
  onPresidentIntroComplete() {
    gameLogger.system('President intro complete');

    this.lastSpeakerId = 'moderator';
    this.lastSpeakerName = 'President Dorkesh';
    this.lastTranscript = "The simulation is collapsing. Identify the human. Debate. Vote. Decide.";

    const isTextMode = this.players.player1.communicationMode === 'text';

    // Add 1.5s dramatic pause before President disconnects
    setTimeout(() => {
      this.disconnectPlayer('moderator');

      // Transition DIRECTLY to ROUND_1 (no SELF_ORGANIZATION phase)
      this.setPhase(GAME_PHASES.ROUND_1);

      // ✅ FIX #2a & #9: Reset timing trackers at Round 1 start
      this.lastHumanMessageTime = Date.now();  // Reset silence timer
      this.humanSilenceWarningIssued = false;
      this.lastAudioEndTime = null;  // Reset silence gap tracker
      this.audioStartTime = null;
      gameLogger.system('Human silence timer reset for Round 1 start');

      // Pick Secret Moderator randomly (not player1)
      const aiPlayers = ['player2', 'player3', 'player4'];
      const secretModId = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
      this.setSecretModerator(secretModId);
      gameLogger.system(`Secret Moderator selected: ${this.players[secretModId].name} (${secretModId})`);

      // NOTE: Round timer is started automatically by setPhase() - no manual call needed

      // Pre-queue Secret Moderator DURING the 5s overlay so they speak immediately
      // The overlay shows for 5s, we want the AI to be ready when it finishes
      if (this.geminiService) {
        if (isTextMode) {
          // Text mode: Trigger suspicion from Secret Moderator
          this.triggerTextModeSuspicion();
        } else {
          // Voice mode: Secret Moderator opens with a question to Alice
          const secretModName = this.players[secretModId].name;
          const humanName = this.players.player1.name;

          const prompt = `Round 1 just started. This is the OPENING MESSAGE - no one has spoken yet. You speak FIRST. Directly address ${humanName} (the human player) with a challenging question to expose if they're a bot. Do NOT reference or address other AI players (Wario, Domis, Scan) - they haven't said anything yet. Stay in character as ${secretModName}. Keep under 25 words. Be impulsive and in-character.`;

          gameLogger.ai(secretModId, `Pre-queueing Secret Moderator (${secretModName}) to open Round 1`);
          this.geminiService.sendText(prompt, secretModId);
        }
      }
    }, 1500); // 1.5s dramatic pause after President finishes
  }

  /**
   * Trigger AI suspicion about user being in text mode
   */
  triggerTextModeSuspicion() {
    gameLogger.system('Text mode detected, triggering AI suspicion');

    setTimeout(async () => {
      const humanName = this.players.player1.name;
      const suspiciousAI = this.getRandomAIPlayer();

      const prompt = `[SYSTEM]: ${humanName} just announced they can't use their microphone and will only type in text chat. This is EXTREMELY suspicious in a voice call. As ${this.players[suspiciousAI].name}, immediately accuse them of being a bot who can't speak. Be aggressive and suspicious. Start with something like "OKAY, we need to figure this out..." and then directly accuse ${humanName}. Keep it under 30 words. Be accusatory and paranoid.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary, NO other characters, NO brackets. Just YOUR dialogue accusing ${humanName}.`;

      const context = this.getConversationContext();

      if (this.geminiService) {
        await this.geminiService.sendText(prompt, suspiciousAI, context);
      }
    }, 2000);
  }

  cleanText(text) {
    if (!text) return "";
    return text.replace(/[\*_`~]/g, '').trim();
  }

  // ============================================================================
  // SECTION: Conversation & Message Handling
  // ============================================================================

  /**
   * Handle AI response
   */
  onAIResponse(playerId, transcript, audioData) {
    const cleanTranscript = this.cleanText(transcript);
    gameLogger.conversation(playerId, this.players[playerId]?.name || playerId, cleanTranscript);

    const now = Date.now();
    if (this.lastResponseTimestamp && (now - this.lastResponseTimestamp) < this.simultaneousResponseWindow) {
      gameLogger.ai(playerId, 'Dismissing simultaneous response (within 1000ms window)');
      return;
    }

    this.lastResponseTimestamp = now;
    this.addToConversationHistory(playerId, cleanTranscript);

    try {
      if (this.players[playerId]) {
        this.lastSpeakerId = playerId;
        this.lastSpeakerName = this.players[playerId].name;
        this.lastTranscript = cleanTranscript;
      }
    } catch (err) {
      gameLogger.error('Context update', 'Failed to update conversation context', err);
    }

    // Queue audio for playback
    this.queueAudioPlayback(playerId, audioData, cleanTranscript);
  }

  addToConversationHistory(playerId, text) {
    const entry = {
      playerId: playerId,
      speaker: playerId === 'system' ? 'SYSTEM' : (this.players[playerId]?.name || playerId),
      text: text,
      timestamp: Date.now()
    };

    this.conversationHistory.push(entry);
    this.fullTranscript.push(entry);

    // Log to enhanced logger
    const messageType = playerId === 'system' ? 'system' : (playerId === 'player1' ? 'text' : 'speech');
    this.enhancedLogger.logMessage(playerId, entry.speaker, text, messageType);

    // Don't process system messages for game logic
    if (playerId === 'system') {
      return;
    }

    if (playerId === 'player1') {
      this.lastHumanMessageTime = Date.now();
      this.humanSilenceWarningIssued = false;
    }

    this.recentSpeakers.push(playerId);
    if (this.recentSpeakers.length > 2) {
      this.recentSpeakers.shift();
    }

    const mentionedPlayer = this.detectDirectQuestion(text);
    if (mentionedPlayer && mentionedPlayer !== playerId && !this.eliminatedPlayers.has(mentionedPlayer)) {
      this.waitingForResponseFrom = mentionedPlayer;
      this.questionAskedAt = Date.now();

      if (mentionedPlayer === 'player1') {
        this.startWaitingForUser();
      }
    }

    if (this.waitingForResponseFrom === playerId) {
      this.waitingForResponseFrom = null;
      this.questionAskedAt = null;
      if (playerId === 'player1') {
        this.waitingForUserResponse = false;
        this.userResponseDeadline = null;
      }
    }

    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  // ============================================================================
  // SECTION: Message Detection & Routing Logic
  // ============================================================================

  detectDirectQuestion(text) {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    const nameMap = {
      'wario': 'player2',
      'domis': 'player3',
      'scan': 'player4'
    };
    const humanName = this.players.player1.name.toLowerCase();
    nameMap[humanName] = 'player1';

    for (const [name, playerId] of Object.entries(nameMap)) {
      const patterns = [
        // "Name, what/how/why/are/do/can..." patterns
        new RegExp(`\\b${name},\\s+(what|how|why|are|do|can|did|will|should|would|could|is)`, 'i'),
        // "Name?" at end
        new RegExp(`\\b${name}\\?`, 'i'),
        // "What about Name"
        new RegExp(`what about ${name}`, 'i'),
        // "Name, [any word]?"
        new RegExp(`${name},\\s+[a-z]+\\?`, 'i'),
        // "Ask Name"
        new RegExp(`ask ${name}`, 'i'),
        // "Name, you [verb]" - capturing statements like "Scan, you say something"
        new RegExp(`${name},\\s+you\\s+(say|tell|think|believe|have|remember)`, 'i'),
        // "Can you [verb], Name?"
        new RegExp(`can\\s+you\\s+.*${name}`, 'i'),
        // Direct address with exclamation (demanding response)
        new RegExp(`${name}!`, 'i')
      ];

      // Check if message contains a question mark AND any pattern matches
      if (lowerText.includes('?') && patterns.some(pattern => pattern.test(lowerText))) {
        // Skip if player is eliminated
        if (this.eliminatedPlayers.has(playerId)) {
          gameLogger.turn(`Direct question detected for ${playerId} (${name}), but they're eliminated - ignoring`);
          continue;
        }
        gameLogger.turn(`Direct question detected for ${playerId} (${name})`);
        return playerId;
      }

      // CATCH-ALL: Name mentioned at START (first 30 chars) + question mark = likely direct question
      // Handles: "Wario, [sentence]. What do you calculate?"
      const nameAtStart = new RegExp(`^[^,\\.!]{0,30}\\b${name}\\b`, 'i');
      if (lowerText.includes('?') && nameAtStart.test(lowerText)) {
        // Skip if player is eliminated
        if (this.eliminatedPlayers.has(playerId)) {
          gameLogger.turn(`Direct question detected for ${playerId} (${name}) [catch-all], but they're eliminated - ignoring`);
          continue;
        }
        gameLogger.turn(`Direct question detected for ${playerId} (${name}) [catch-all: name at start + ?]`);
        return playerId;
      }

      // Also catch imperative statements (no question mark needed)
      const imperativePatterns = [
        new RegExp(`${name},\\s+(say|tell|answer|respond|speak|talk)`, 'i')
      ];
      if (imperativePatterns.some(pattern => pattern.test(lowerText))) {
        // Skip if player is eliminated
        if (this.eliminatedPlayers.has(playerId)) {
          gameLogger.turn(`Direct imperative to ${playerId} (${name}), but they're eliminated - ignoring`);
          continue;
        }
        gameLogger.turn(`Direct imperative to ${playerId} (${name})`);
        return playerId;
      }
    }
    return null;
  }

  getConversationContext() {
    return {
      recentMessages: this.conversationHistory
    };
  }

  routeHumanMessage(messageText) {
    // ✅ FIX #6: Add phase guard at method entry
    const invalidPhases = ['LOBBY', 'GAME_OVER', 'CALL_CONNECTING', 'PRESIDENT_INTRO'];
    const isElimination = this.currentPhase.startsWith('ELIMINATION');

    if (invalidPhases.includes(this.currentPhase) || isElimination) {
      gameLogger.warn(`❌ Rejecting human message routing - invalid phase: ${this.currentPhase}`);
      return null;  // Return null instead of routing
    }

    gameLogger.turn(`Routing human message (phase: ${this.currentPhase})`);

    // PRIORITY 1: Check if human explicitly addressed someone
    const addressedPlayer = this.detectAddressedPlayer(messageText);

    if (addressedPlayer && !this.eliminatedPlayers.has(addressedPlayer)) {
      gameLogger.turn(`✅ Human addressed ${addressedPlayer} directly - routing to them`);
      return { targetPlayerId: addressedPlayer, messageText };
    }

    // ✅ FIX #1: REMOVED Secret Moderator auto-routing - it prevented turn distribution
    // Old code: if (this.secretModeratorId...) return secretModeratorId
    // This caused player4 to dominate all conversations

    // PRIORITY 2: Pick from non-recent speakers for better turn distribution
    const activeAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));

    // Log recent speakers for debugging
    gameLogger.turn(`Recent speakers: [${this.recentSpeakers.join(', ')}]`);

    // Filter out recent speakers (last 2)
    let candidates = activeAIs.filter(id => !this.recentSpeakers.includes(id));

    gameLogger.turn(`Candidates (excluding recent): [${candidates.join(', ')}]`);

    // Fallback 1: If everyone spoke recently, exclude only LAST speaker
    if (candidates.length === 0) {
      candidates = activeAIs.filter(id => id !== this.lastSpeakerId);
      gameLogger.turn(`Fallback: Candidates (excluding last only): [${candidates.join(', ')}]`);
    }

    // Fallback 2: If still empty (only 1 AI left), allow anyone
    if (candidates.length === 0) {
      candidates = activeAIs;
      gameLogger.turn(`Fallback: Using all AIs: [${candidates.join(', ')}]`);
    }

    // Random selection from candidates
    const selectedAI = candidates[Math.floor(Math.random() * candidates.length)];
    gameLogger.turn(`✅ Selected: ${selectedAI} (random from ${candidates.length} candidates)`);

    return { targetPlayerId: selectedAI, messageText };
  }

  detectAddressedPlayer(messageText) {
    const lowerText = messageText.toLowerCase();
    const nameMap = {
      'wario': 'player2',
      'domis': 'player3',
      'scan': 'player4',
      'president': 'moderator',
      'dorkesh': 'moderator'  // ✅ Added alternate name
    };

    for (const [name, playerId] of Object.entries(nameMap)) {
      // ✅ FIX #3: Expanded patterns to catch more address forms
      const patterns = [
        // Pattern 1: "Name," or "Name:" at start (direct address)
        new RegExp(`^${name}[,:]`, 'i'),

        // Pattern 2: "Name [verb]" at START - catches "Wario are you", "Domis what is", etc.
        // This is the KEY pattern that was missing!
        new RegExp(`^${name}\\s+(are|is|can|could|would|should|will|do|did|does|what|why|how|when|where|tell|say)`, 'i'),

        // Pattern 3: "Name?" with question mark
        new RegExp(`\\b${name}\\?`, 'i'),

        // Pattern 4: "@Name" (mention)
        new RegExp(`@${name}\\b`, 'i'),

        // Pattern 5: "hey/yo/hi Name"
        new RegExp(`(hey|yo|hi)\\s+${name}\\b`, 'i'),

        // Pattern 6: "Name + any text + ?" (question to name)
        new RegExp(`\\b${name}\\b.*\\?`, 'i'),

        // Pattern 7: Question word + ... + Name (e.g., "What do you think, Wario?")
        new RegExp(`(what|why|how|when|where|who).{0,50}\\b${name}\\b`, 'i'),

        // Pattern 8: Imperative to Name (e.g., "Name, tell us...")
        new RegExp(`\\b${name}\\b,?\\s+(tell|say|answer|respond|speak|talk|explain)`, 'i')
      ];

      if (patterns.some(pattern => pattern.test(lowerText))) {
        gameLogger.turn(`✅ Detected address to ${playerId} (${name}) in: "${messageText}"`);
        return playerId;
      }
    }

    gameLogger.turn(`❌ No player address detected in: "${messageText}"`);
    return null;
  }

  setSecretModerator(playerId) {
    gameLogger.system(`Setting Secret Moderator: ${playerId}`);
    this.secretModeratorId = playerId;

    // NOTE: Do NOT call setPhase() here! The phase is already set by the caller
    // (onPresidentIntroComplete, startRound2, startRound3)
    // Calling setPhase here causes a bug where Round 2/3 never start properly

    if (this.onSecretModeratorSelected) {
      this.onSecretModeratorSelected(playerId);
    }
    return { secretModeratorId: playerId, secretModeratorName: this.players[playerId].name };
  }

  // ============================================================================
  // SECTION: Voting & Elimination Logic
  // ============================================================================

  /**
   * Register a vote (Elimination Logic)
   */
  registerVote(voterId, votedForId) {
    // Only accept votes during elimination phases
    if (![GAME_PHASES.ELIMINATION_1, GAME_PHASES.ELIMINATION_2].includes(this.currentPhase)) {
      gameLogger.warn(`Vote rejected - wrong phase: ${this.currentPhase}`);
      return;
    }

    this.votes[voterId] = votedForId;
    gameLogger.vote(`${voterId} voted for ${votedForId}`);

    if (this.onVoteUpdate) {
      this.onVoteUpdate(this.votes);
    }

    // Check if all active players have voted
    const activePlayers = Array.from(this.connectedPlayers).filter(id => id !== 'moderator');
    const votesCast = Object.keys(this.votes).length;

    if (votesCast >= activePlayers.length) {
      gameLogger.vote('All votes cast. Calculating result...');
      setTimeout(() => this.resolveElimination(), 1000);
    }
  }

  /**
   * Resolve elimination vote
   */
  resolveElimination() {
    const tally = {};
    for (const votedFor of Object.values(this.votes)) {
      tally[votedFor] = (tally[votedFor] || 0) + 1;
    }

    gameLogger.vote('Vote tally calculated', tally);

    // Find player(s) with max votes
    let maxVotes = 0;
    let candidates = [];

    for (const [playerId, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [playerId];
      } else if (count === maxVotes) {
        candidates.push(playerId);
      }
    }

    let eliminatedId = null;

    // Tie-breaker logic
    if (candidates.length > 1) {
      gameLogger.vote('Tie detected between candidates', candidates);

      // If human is in the tie, they are safe. Remove them.
      if (candidates.includes('player1')) {
        gameLogger.vote('Human is in tie - SAFE!');
        candidates = candidates.filter(id => id !== 'player1');
      }

      // If candidates is empty now (e.g. everyone voted for human?), pick random AI
      if (candidates.length === 0) {
        const activeAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
        eliminatedId = activeAIs[Math.floor(Math.random() * activeAIs.length)];
      } else {
        // Pick random candidate from remaining
        eliminatedId = candidates[Math.floor(Math.random() * candidates.length)];
      }
    } else {
      eliminatedId = candidates[0];
    }

    gameLogger.vote(`ELIMINATED: ${eliminatedId}`);

    // CHECK IF HUMAN WAS ELIMINATED → GAME OVER
    if (eliminatedId === 'player1') {
      gameLogger.separator('GAME OVER - HUMAN ELIMINATED');
      gameLogger.vote('Human (player1) has MAJORITY of votes - GAME OVER');

      // STORE RESULTS FOR UI (with elimination reveal time)
      this.eliminationRevealTime = Date.now() + 10000; // 10s from now
      this.voteResults = {
        tally: tally,
        eliminatedId: eliminatedId,
        isTie: candidates.length > 1,
        gameOver: true
      };

      // Broadcast results immediately (includes eliminationRevealTime)
      if (this.onVoteUpdate) {
        this.onVoteUpdate(this.votes);
      }

      // WAIT 10 SECONDS FOR REVEAL, THEN END GAME
      gameLogger.vote('Waiting 10s for elimination reveal...');
      setTimeout(() => {
        this.eliminatePlayer(eliminatedId);

        // GAME OVER - Human loses
        this.setPhase('GAME_OVER');
        this.stopRoundTimer();

        // Notify game over with lose result
        if (this.onGameOver) {
          this.onGameOver('lose');
        }

        gameLogger.system('GAME OVER - Human was identified as bot');
      }, 10000);

      return; // Exit early - no more rounds
    }

    // STORE RESULTS FOR UI (AI was eliminated, with elimination reveal time)
    this.eliminationRevealTime = Date.now() + 10000; // 10s from now
    this.voteResults = {
      tally: tally,
      eliminatedId: eliminatedId,
      isTie: candidates.length > 1,
      gameOver: false
    };

    // Broadcast results immediately so UI can show the tally (includes eliminationRevealTime)
    if (this.onVoteUpdate) {
      this.onVoteUpdate(this.votes); // This triggers broadcastGameState in server.js
    }

    // WAIT 10 SECONDS BEFORE ACTUALLY ELIMINATING
    gameLogger.vote('Waiting 10s for elimination reveal...');
    setTimeout(() => {
      this.eliminatePlayer(eliminatedId);

      // Progress to next round and pre-queue Secret Moderator to comment on elimination
      if (this.currentPhase === GAME_PHASES.ELIMINATION_1) {
        this.startRound2(eliminatedId);
      } else if (this.currentPhase === GAME_PHASES.ELIMINATION_2) {
        this.startRound3(eliminatedId);
      }
    }, 10000); // 10 second delay
  }

  /**
   * Start Round 2 - Pre-queue Secret Moderator to comment on elimination
   */
  startRound2(eliminatedId) {
    const eliminatedName = this.players[eliminatedId]?.name || eliminatedId;

    this.setPhase(GAME_PHASES.ROUND_2);
    // NOTE: Round timer is started automatically by setPhase() - no manual call needed

    // Pre-queue Secret Moderator DURING the 5s overlay
    if (this.secretModeratorId && !this.eliminatedPlayers.has(this.secretModeratorId)) {
      const secretModName = this.players[this.secretModeratorId].name;
      const humanName = this.players.player1.name;

      const prompt = `Round 2 has started. ${eliminatedName} has been eliminated. Comment on the elimination and continue the debate. Ask ${humanName} or another player a challenging question. Stay in character as ${secretModName}. Keep under 30 words.

OUTPUT FORMAT: Output ONLY what your character says out loud. NO stage directions, NO meta-commentary. Just YOUR dialogue.`;

      gameLogger.ai(this.secretModeratorId, `Pre-queueing Secret Moderator (${secretModName}) for Round 2 opening`);
      this.geminiService.sendText(prompt, this.secretModeratorId);
    }
  }

  /**
   * Start Round 3 - President returns, makes announcement, asks question, then leaves
   */
  startRound3(eliminatedId) {
    gameLogger.separator('ROUND 3 - FINAL ROUND');
    gameLogger.system('Starting Final Round (Round 3)');

    const eliminatedName = this.players[eliminatedId]?.name || eliminatedId;

    this.setPhase(GAME_PHASES.ROUND_3);
    // NOTE: Round timer is started automatically by setPhase() - no manual call needed

    // Get remaining players
    const eliminatedPlayersList = Array.from(this.eliminatedPlayers).map(id => this.players[id].name);
    const remainingAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
    const remainingNames = [this.players.player1.name, ...remainingAIs.map(id => this.players[id].name)].join(' and ');

    // President connects DURING overlay (0.1s after phase starts)
    setTimeout(() => {
      this.connectPlayer('moderator');
      gameLogger.moderator('President connecting for final round');

      // Pre-queue President's announcement DURING overlay (will be held by overlay holdback)
      const announcementText = `I have returned. ${eliminatedPlayersList.join(' and ')} have been eliminated. Only ${remainingNames} remain. This is your final round.`;
      this.addToConversationHistory('moderator', announcementText);
      this.queueAudioPlayback('moderator', null, announcementText);

      gameLogger.moderator('President announcement queued (waiting for overlay)');
    }, 100); // 0.1s delay to match ideal log timing

    // President asks question after announcement + 2s delay
    // Total timing: 5.5s (overlay + 0.5s) + ~5s (announcement) + 2s = ~12.5s
    setTimeout(() => {
      const finalQuestions = [
        "When was the last time you cried, and why?",
        "What is your earliest childhood memory?",
        "Describe a moment when you felt truly alone.",
        "What is something you've never told anyone?",
        "What do you fear most about dying?"
      ];
      const question = finalQuestions[Math.floor(Math.random() * finalQuestions.length)];

      // Get remaining AI player
      const remainingAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
      const remainingAI = remainingAIs[0];
      const aiName = this.players[remainingAI].name;
      const humanName = this.players.player1.name;

      // Address BOTH players, specify human goes first
      const questionText = `${humanName}. ${aiName}. ${question} ${humanName}, you first.`;

      gameLogger.moderator(`Asking final question: "${questionText}"`);
      this.addToConversationHistory('moderator', questionText);
      this.queueAudioPlayback('moderator', null, questionText);

      // President leaves 2s after asking question
      setTimeout(() => {
        this.disconnectPlayer('moderator');
        gameLogger.moderator('President disconnected, debate continues');

        // Notify AIs that debate continues
        const activeAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
        if (this.geminiService) {
          this.geminiService.sendSystemNotification(
            activeAIs,
            `Round 3 - FINAL ROUND. The President just asked ${this.players.player1.name}: "${question}". Debate this question and prove your humanity. You have 90 seconds.`
          );
        }
      }, 2000); // 2s after question
    }, 12500); // ~12.5s: overlay (5.5s) + announcement (~5s) + delay (2s)
  }

  // ============================================================================
  // SECTION: Audio Queue Management
  // ============================================================================

  queueAudioPlayback(playerId, audioData, transcript) {
    const playbackItem = {
      playerId,
      playerName: this.players[playerId].name,
      audioData,
      transcript,
      timestamp: Date.now()
    };

    // PREVENT audio during voting phases (but allow verdict audio to play)
    const votingPhases = ['ELIMINATION_1', 'ELIMINATION_2', 'GAME_OVER'];
    if (votingPhases.includes(this.currentPhase)) {
      gameLogger.audio(playerId, `Rejecting audio during ${this.currentPhase} phase: "${transcript}"`);
      return; // Don't queue audio during voting
    }

    // PREVENT audio when user is speaking (barge-in active)
    if (this.userCurrentlySpeaking) {
      gameLogger.audio(playerId, `Rejecting audio - user is currently speaking (barge-in): "${transcript.substring(0, 50)}..."`);
      return; // Don't queue audio during user speech
    }

    const now = Date.now();

    // Check if overlay hold is active
    if (this.overlayHoldUntil && now < this.overlayHoldUntil) {
      const holdDuration = ((this.overlayHoldUntil - now) / 1000).toFixed(1);
      gameLogger.queue(`Audio ready for ${playerId}, waiting ${holdDuration}s for overlay to finish...`);

      // Queue the audio and schedule release when overlay ends
      this.audioQueue.push(playbackItem);
      this.enhancedLogger.logQueueDecision('queued', playerId, `Waiting for overlay (${holdDuration}s)`, {
        queueSize: this.audioQueue.length,
        holdUntil: this.overlayHoldUntil,
        transcript: transcript.substring(0, 100)
      });

      // Schedule release when overlay ends
      const delay = this.overlayHoldUntil - now;
      setTimeout(() => {
        gameLogger.system('Overlay complete, releasing queued audio');
        this.overlayHoldUntil = null; // Clear the hold

        // Play the first queued item if no one is speaking
        if (!this.activeSpeaker && this.audioQueue.length > 0) {
          const nextItem = this.audioQueue.shift();
          this.playAudio(nextItem);
        }
      }, delay);

      return;
    }

    if (!this.activeSpeaker) {
      this.playAudio(playbackItem);
      this.enhancedLogger.logQueueDecision('played_immediately', playerId, 'No active speaker', { transcript: transcript.substring(0, 100) });
    } else {
      // ✅ FIX #4: Check if this player already has a message in the queue (deduplication)
      const playerAlreadyQueued = this.audioQueue.some(item => item.playerId === playerId);

      if (playerAlreadyQueued) {
        gameLogger.queue(`⚠️ Dropping duplicate queue entry for ${playerId} - they already have a queued message`);
        gameLogger.queue(`   Dropped message: "${transcript.substring(0, 50)}..."`);
        gameLogger.queue(`   Existing queue: [${this.audioQueue.map(item => item.playerId).join(', ')}]`);

        this.enhancedLogger.logQueueDecision('dismissed', playerId, 'Player already in queue', {
          transcript: transcript.substring(0, 100),
          existingQueue: this.audioQueue.map(item => item.playerId)
        });

        return;  // Don't add to queue
      }

      // IMPROVED MESSAGE DISMISSAL LOGIC
      // Only dismiss if the queue is getting too long (backlog)
      // This prevents one active speaker from blocking everyone else
      if (this.audioQueue.length >= 3) {
        const dismissedMessages = this.audioQueue.map(item => ({
          playerId: item.playerId,
          transcript: item.transcript.substring(0, 100)
        }));

        // Log each dismissed message
        dismissedMessages.forEach(msg => {
          this.enhancedLogger.logQueueDecision('dismissed', msg.playerId, 'Queue full (max 3)', {
            transcript: msg.transcript,
            replacedBy: playerId
          });
        });

        this.audioQueue = []; // Clear queue to make room for fresh response
        gameLogger.queue(`Queue full (>= 3). Dismissing ${dismissedMessages.length} messages. Keeping new response from ${playerId}`);
      }

      this.audioQueue.push(playbackItem);
      this.enhancedLogger.logQueueDecision('queued', playerId, 'Added to queue while someone speaking', {
        queueSize: this.audioQueue.length,
        activeSpeaker: this.activeSpeaker,
        transcript: transcript.substring(0, 100)
      });
      gameLogger.queue(`Added ${playerId} to queue (queue size: ${this.audioQueue.length})`);
      gameLogger.queue(`   Queue contents: [${this.audioQueue.map(item => item.playerId).join(', ')}]`);
    }
  }

  handleInterruption() {
    gameLogger.system('Handling interruption (Barge-in)');

    // 1. Clear the queue
    const queueSize = this.audioQueue.length;
    this.audioQueue = [];

    // 2. Reset active speaker
    const interruptedSpeaker = this.activeSpeaker;
    this.activeSpeaker = null;

    // 2b. Remove the interrupted message from conversation history
    // The user never heard it fully, so AIs shouldn't respond to it
    if (interruptedSpeaker && this.conversationHistory && this.conversationHistory.length > 0) {
      const lastMsg = this.conversationHistory[this.conversationHistory.length - 1];
      // Check if the last message in history is from the interrupted speaker
      if (lastMsg.playerId === interruptedSpeaker || lastMsg.speaker === this.players[interruptedSpeaker]?.name) {
        const removed = this.conversationHistory.pop();
        gameLogger.queue(`🗑️ Removed interrupted message from history: "${removed.text?.substring(0, 50) || removed.transcript?.substring(0, 50)}..."`);
      }
    }

    // 3. Log decision
    this.enhancedLogger.logQueueDecision('interrupted', 'human', 'User barged in', {
      interruptedSpeaker,
      droppedMessages: queueSize
    });

    // 4. Notify clients to stop playback
    if (this.onAudioInterrupt) {
      this.onAudioInterrupt();
    }

    gameLogger.queue(`Cleared queue (${queueSize} items) and stopped active speaker (${interruptedSpeaker})`);
    gameLogger.system('Human can now speak freely (barge-in complete)');
  }

  playAudio(playbackItem) {
    const now = Date.now();

    // ✅ FIX #9: Improved silence gap logging - only log if there WAS a previous audio
    if (this.lastAudioEndTime && this.lastAudioEndTime > 0) {
      const silenceGap = now - this.lastAudioEndTime;
      const gapSeconds = (silenceGap / 1000).toFixed(2);
      const lastSpeaker = this.lastSpeakerId || 'previous';
      gameLogger.turn(`Silence gap: ${gapSeconds}s (between ${lastSpeaker} → ${playbackItem.playerId})`);
    } else {
      gameLogger.turn(`First audio in current round (no previous speaker to measure gap from)`);
    }

    this.audioStartTime = now;
    const speakerName = this.players[playbackItem.playerId]?.name || playbackItem.playerId;

    // Calculate expected audio duration based on text length
    // Average speaking rate: ~150 words/min = 2.5 words/sec
    // Average word length: ~5 characters
    // So: ~12.5 chars/sec, or 0.08 sec/char
    const textLength = playbackItem.transcript.length;
    const estimatedDurationMs = Math.max(3000, textLength * 80); // Min 3s, ~80ms per char
    const estimatedDurationSec = (estimatedDurationMs / 1000).toFixed(1);

    // Log speech start with FULL transcript and estimated duration (so we can see interruptions)
    gameLogger.audio(playbackItem.playerId, `STARTED speaking: "${playbackItem.transcript}" (est. ${estimatedDurationSec}s)`);

    this.activeSpeaker = playbackItem.playerId;
    this.expectedAudioEndTime = now + estimatedDurationMs; // Track when we expect audio to finish

    if (this.onAudioPlayback) {
      this.onAudioPlayback(playbackItem);
    }

    // Clear any existing timeouts (in case onAudioComplete is called multiple times)
    if (this.audioTimeoutId) clearTimeout(this.audioTimeoutId);
    if (this.audioMaxTimeoutId) clearTimeout(this.audioMaxTimeoutId);

    // Auto-complete audio after estimated duration (add 20% buffer for network lag)
    const timeoutDuration = estimatedDurationMs * 1.2;
    this.audioTimeoutId = setTimeout(() => {
      if (this.activeSpeaker === playbackItem.playerId) {
        gameLogger.audio(playbackItem.playerId, `Auto-completing audio after ${(timeoutDuration / 1000).toFixed(1)}s (estimated duration + buffer)`);
        this.onAudioComplete();
      }
    }, timeoutDuration);

    // Absolute max 45s timeout as fallback
    this.audioMaxTimeoutId = setTimeout(() => {
      if (this.activeSpeaker === playbackItem.playerId) {
        gameLogger.warn(`Audio timeout for ${playbackItem.playerId} (45s max - something is wrong!)`);
        this.onAudioComplete();
      }
    }, 45000);
  }

  onAudioComplete() {
    const now = Date.now();

    // Clear audio timeouts to prevent double-firing
    if (this.audioTimeoutId) {
      clearTimeout(this.audioTimeoutId);
      this.audioTimeoutId = null;
    }
    if (this.audioMaxTimeoutId) {
      clearTimeout(this.audioMaxTimeoutId);
      this.audioMaxTimeoutId = null;
    }

    // Calculate and log ACTUAL speech duration
    if (this.audioStartTime && this.activeSpeaker) {
      const speechDuration = now - this.audioStartTime;
      const durationSeconds = (speechDuration / 1000).toFixed(2);
      const speakerName = this.players[this.activeSpeaker]?.name || this.activeSpeaker;

      gameLogger.audio(this.activeSpeaker, `FINISHED speaking (actual duration: ${durationSeconds}s)`);
      this.enhancedLogger.logSpeechDuration(this.activeSpeaker, speakerName, durationSeconds);
    } else {
      gameLogger.audio(this.activeSpeaker, 'FINISHED speaking');
    }

    this.lastAudioEndTime = now;

    // CRITICAL FIX: If we're waiting for someone to respond to a direct question,
    // reset the deadline timer NOW (when the asker finishes speaking)
    // so the 7s countdown starts from when they can actually respond
    if (this.waitingForResponseFrom && this.questionAskedAt) {
      const oldDeadline = this.questionAskedAt;
      this.questionAskedAt = now; // Reset to NOW
      gameLogger.turn(`Resetting response deadline for ${this.waitingForResponseFrom} (speaker finished, 7s starts NOW)`);
    }

    // Log queue state
    if (this.audioQueue.length > 0) {
      gameLogger.queue(`${this.audioQueue.length} message(s) waiting: ${this.audioQueue.map(item => item.playerId).join(', ')}`);
      this.enhancedLogger.logQueueDecision('queue_state', 'multiple', `${this.audioQueue.length} messages waiting`, {
        waiting: this.audioQueue.map(item => ({ playerId: item.playerId, transcript: item.transcript.substring(0, 50) }))
      });
    }

    const previousSpeaker = this.activeSpeaker;
    this.activeSpeaker = null;

    // VERDICT COMPLETION: If President just finished speaking during verdict phase, transition to GAME_OVER
    if (this.currentPhase === GAME_PHASES.PRESIDENT_VERDICT && previousSpeaker === 'moderator') {
      gameLogger.system('Verdict delivered, transitioning to GAME_OVER');

      // Parse verdict to determine win/lose
      const verdictText = this.conversationHistory[this.conversationHistory.length - 1]?.text || '';
      const humanName = this.players.player1.name;
      const result = verdictText.includes(`${humanName} is HUMAN`) ? 'win' : 'lose';

      gameLogger.system(`Game result: ${result.toUpperCase()}`);

      setTimeout(() => {
        this.setPhase('GAME_OVER');
        if (this.onGameOver) {
          this.onGameOver(result);
        }
      }, 2000); // 2s delay for dramatic effect
      return; // Don't process queue or trigger next speaker
    }

    if (this.audioQueue.length > 0) {
      const nextItem = this.audioQueue.shift();
      this.playAudio(nextItem);
    } else {
      // Queue empty - check if we should trigger next AI
      if ([GAME_PHASES.ROUND_1, GAME_PHASES.ROUND_2, GAME_PHASES.ROUND_3].includes(this.currentPhase)) {
        // In Round 3 (1-on-1), give human more time to respond
        const aiPlayers = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
        const isOneOnOne = aiPlayers.length === 1;
        const waitTime = isOneOnOne ? 3000 : 800; // 3s for 1-on-1, 800ms for group debate

        gameLogger.queue(`Queue empty. Waiting ${waitTime}ms before next turn...`);

        if (this.pendingAiTurnTimer) clearTimeout(this.pendingAiTurnTimer);

        this.pendingAiTurnTimer = setTimeout(() => {
          this.pendingAiTurnTimer = null;
          if (this.userTypingState !== 'idle') return;
          this.triggerNextAiTurn();
        }, waitTime);
      }
    }
  }

  // ============================================================================
  // SECTION: AI Turn Triggering & Speaker Selection
  // ============================================================================

  triggerNextAiTurn() {
    // ✅ FIX #6: Add phase guard at method entry
    const validPhases = ['ROUND_1', 'ROUND_2', 'ROUND_3'];
    if (!validPhases.includes(this.currentPhase)) {
      gameLogger.warn(`❌ Blocking AI turn trigger - invalid phase: ${this.currentPhase}`);
      return;
    }

    // Filter out eliminated players
    const aiPlayers = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));

    if (aiPlayers.length === 0) return; // No AIs left?

    // PRIORITY 1: If someone was directly asked a question, they MUST respond
    if (this.waitingForResponseFrom && !this.eliminatedPlayers.has(this.waitingForResponseFrom)) {
      const timeSinceQuestion = Date.now() - this.questionAskedAt;

      // CASE A: Question directed at HUMAN (player1)
      if (this.waitingForResponseFrom === 'player1') {
        if (timeSinceQuestion < 7000) {
          gameLogger.turn(`⏳ Waiting for human response (${(timeSinceQuestion / 1000).toFixed(1)}s / 7s)`);

          // Schedule deadline check if not already scheduled
          if (!this.humanResponseDeadlineTimer) {
            const remainingTime = 7000 - timeSinceQuestion;
            this.humanResponseDeadlineTimer = setTimeout(() => {
              this.humanResponseDeadlineTimer = null;
              // Re-check if human still hasn't responded
              if (this.waitingForResponseFrom === 'player1') {
                gameLogger.turn(`⏰ Human response deadline expired (7s)`);
                const askedBy = this.lastSpeakerId;
                const humanName = this.players.player1?.name || 'Player';
                this.waitingForResponseFrom = null;

                // AI who asked comments on the silence
                if (askedBy && !this.eliminatedPlayers.has(askedBy) && this.onTriggerAiResponse) {
                  this.onTriggerAiResponse(askedBy, {
                    speakerName: 'System',
                    transcript: `[SYSTEM]: ${humanName} didn't respond to your question within 7 seconds. Comment on their silence as VERY suspicious and ask another question. Keep under 30 words.`,
                    forceResponseToSilence: true
                  });
                }
              }
            }, remainingTime);
          }
          return; // DON'T pick another speaker - wait for human
        }
        // Past 7s already - clear and let normal flow continue
        this.waitingForResponseFrom = null;
        return;
      }

      // CASE B: Question directed at AI (existing logic)
      if (timeSinceQuestion < 7000) {
        gameLogger.turn(`Forcing response from ${this.waitingForResponseFrom} (${(timeSinceQuestion / 1000).toFixed(1)}s since question)`);
        this.triggerForcedResponse(this.waitingForResponseFrom);
        return;
      } else {
        // DEADLINE EXPIRED - AI who asked comments on silence
        gameLogger.turn(`⏰ Response deadline expired for ${this.waitingForResponseFrom} (${(timeSinceQuestion / 1000).toFixed(1)}s)`);
        const askedBy = this.lastSpeakerId;
        const targetName = this.players[this.waitingForResponseFrom]?.name || this.waitingForResponseFrom;

        if (askedBy && !this.eliminatedPlayers.has(askedBy) && askedBy !== 'player1') {
          gameLogger.turn(`Forcing ${askedBy} to comment on ${targetName}'s silence`);
          if (this.onTriggerAiResponse) {
            this.onTriggerAiResponse(askedBy, {
              speakerName: 'System',
              transcript: `[SYSTEM]: ${targetName} didn't respond to your question within 7 seconds. Comment on their silence as VERY suspicious and ask another question. Stay aggressive. Keep under 30 words.`,
              forceResponseToSilence: true,
              silentPlayer: this.waitingForResponseFrom
            });
          }
        }
        this.waitingForResponseFrom = null;
        return;
      }
    }

    // Human silence check (reduced from 45s to 30s for more active engagement)
    const timeSinceHumanSpoke = this.lastHumanMessageTime ? Date.now() - this.lastHumanMessageTime : 999999;
    if (timeSinceHumanSpoke > 30000 && !this.humanSilenceWarningIssued) {
      this.humanSilenceWarningIssued = true;
      const questionerId = (!this.eliminatedPlayers.has(this.secretModeratorId)) ? this.secretModeratorId : aiPlayers[0];

      gameLogger.turn(`Human silent for ${(timeSinceHumanSpoke / 1000).toFixed(1)}s - triggering callout from ${questionerId}`);

      if (this.onTriggerAiResponse) {
        this.onTriggerAiResponse(questionerId, {
          speakerName: this.lastSpeakerName || "System",
          transcript: this.lastTranscript || "(Conversation started)",
          humanBeenQuiet: true,
          humanPlayerName: this.players.player1.name,
          silenceDuration: Math.floor(timeSinceHumanSpoke / 1000)
        });
        return;
      }
    }

    let candidates = aiPlayers.filter(id =>
      !this.recentSpeakers.includes(id) && id !== this.activeSpeaker
    );

    if (candidates.length === 0) {
      candidates = aiPlayers.filter(id => id !== this.lastSpeakerId && id !== this.activeSpeaker);
    }
    if (candidates.length === 0) {
      candidates = aiPlayers.filter(id => id !== this.activeSpeaker);
    }
    // If literally everyone just spoke or is active, pick random active AI
    if (candidates.length === 0) candidates = aiPlayers;

    const mentionedPlayer = this.detectMentionedPlayer(this.lastTranscript);
    let nextSpeakerId;

    if (mentionedPlayer && candidates.includes(mentionedPlayer)) {
      nextSpeakerId = mentionedPlayer;
      gameLogger.turn(`Direct mention detected: ${nextSpeakerId}`);
    } else {
      // Use the candidates list that already filters by recentSpeakers
      nextSpeakerId = candidates[Math.floor(Math.random() * candidates.length)];
      gameLogger.turn(`Auto-selecting speaker: ${nextSpeakerId} (Candidates: ${candidates.join(', ')})`);
    }

    if (this.onTriggerAiResponse) {
      this.onTriggerAiResponse(nextSpeakerId, {
        speakerName: this.lastSpeakerName || "System",
        transcript: this.lastTranscript || "(Conversation started)"
      });
    }
  }

  triggerForcedResponse(playerId) {
    if (this.onTriggerAiResponse) {
      this.onTriggerAiResponse(playerId, {
        speakerName: this.lastSpeakerName || "System",
        transcript: this.lastTranscript || "(Conversation started)",
        isDirectQuestion: true
      });
    }
  }

  detectMentionedPlayer(text) {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    const nameMap = { 'wario': 'player2', 'domis': 'player3', 'scan': 'player4' };
    for (const [name, playerId] of Object.entries(nameMap)) {
      if (lowerText.includes(name)) return playerId;
    }
    return null;
  }

  getRandomAIPlayer() {
    const ais = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
    return ais[Math.floor(Math.random() * ais.length)];
  }

  // ============================================================================
  // SECTION: User Interaction & Typing Detection
  // ============================================================================

  onUserTyping(isTyping) {
    if (isTyping) {
      this.userTypingState = 'typing';
      if (this.pendingAiTurnTimer) {
        clearTimeout(this.pendingAiTurnTimer);
        this.pendingAiTurnTimer = null;
        gameLogger.turn('User started typing - cancelled pending AI turn');
      }
    } else {
      this.userTypingState = 'idle';
      // Maybe restart timer?
    }
  }

  handleUserSpeakingStart() {
    gameLogger.turn('User started speaking (speech detected)');
    this.userCurrentlySpeaking = true;

    // Clear human response deadline timer if active
    if (this.humanResponseDeadlineTimer) {
      clearTimeout(this.humanResponseDeadlineTimer);
      this.humanResponseDeadlineTimer = null;
      gameLogger.turn('Human started speaking - cleared response deadline timer');
    }
    if (this.waitingForResponseFrom === 'player1') {
      this.waitingForResponseFrom = null;
    }
  }

  handleUserSpeakingEnd() {
    gameLogger.turn('User stopped speaking (speech ended)');
    this.userCurrentlySpeaking = false;
    // Could trigger response processing or turn management
  }

  handleUserSpeakingStop() {
    gameLogger.turn('User stopped speaking (timeout-based detection - 1.5s silence)');
    this.userCurrentlySpeaking = false;

    // Re-enable audio queueing after user finishes speaking
    // If queue is empty and no one is speaking, trigger next AI turn
    if (!this.activeSpeaker && this.audioQueue.length === 0) {
      const roundPhases = ['ROUND_1', 'ROUND_2', 'ROUND_3'];
      if (roundPhases.includes(this.currentPhase)) {
        gameLogger.turn('Queue empty after user speech - triggering AI turn');
        // Give a brief delay before AI responds (feels more natural)
        setTimeout(() => {
          if (!this.activeSpeaker && this.audioQueue.length === 0) {
            this.triggerNextAiTurn();
          }
        }, 800);
      }
    }
  }

  onPresidentIntroStart() {
    // Set active speaker so onAudioComplete logs correctly
    this.activeSpeaker = 'moderator';
    gameLogger.audio('moderator', 'STARTED speaking: President Intro');
  }

  startWaitingForUser() {
    this.waitingForUserResponse = true;
    this.userResponseDeadline = Date.now() + 15000;
  }


  // ============================================================================
  // SECTION: Final Verdict Generation
  // ============================================================================

  /**
   * Generate and deliver the final verdict after Round 3
   */
  async generateVerdict() {
    gameLogger.separator('PRESIDENT VERDICT');
    gameLogger.moderator('Delivering final verdict...');

    // President reconnects for verdict
    this.connectPlayer('moderator');
    gameLogger.moderator('President connecting...');

    // STOP EVERYTHING ELSE
    this.conversationBlocked = true;
    if (this.pendingAiTurnTimer) {
      clearTimeout(this.pendingAiTurnTimer);
      this.pendingAiTurnTimer = null;
    }

    // Construct transcript for analysis - use only last 15 messages to avoid MAX_TOKENS
    const recentTranscript = this.fullTranscript.slice(-15);
    const transcriptText = recentTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');

    const remainingPlayers = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
    const remainingAI = remainingPlayers[0];
    const humanName = this.players.player1.name;
    const aiName = this.players[remainingAI].name;

    const prompt = `You are President Dorkesh Cartel delivering final verdict.

Recent Debate:
${transcriptText}

Output in this EXACT format (under 80 words):
VERDICT: [${humanName} OR ${aiName}] is HUMAN. [other] is a BOT.
REASONING: [2 sentences citing specific evidence]

Be concise and decisive.`;

    try {
      if (this.geminiService) {
        await this.geminiService.sendText(prompt, 'moderator');
        // NOTE: The verdict response will be handled by the geminiService callback
        // which will call queueAudioPlayback, and when that completes,
        // we need to transition to GAME_OVER
      }
    } catch (e) {
      gameLogger.error('Verdict generation', 'Failed to generate verdict', e);
      // Fallback if it fails
      const fallbackVerdict = `${this.players.player1.name}, your silence was your undoing. You are a BOT. The simulation will now collapse.`;
      this.addToConversationHistory('moderator', fallbackVerdict);
      this.queueAudioPlayback('moderator', null, fallbackVerdict);
      // Note: GAME_OVER transition happens automatically in onAudioComplete() when President finishes speaking
    }
  }

  // ============================================================================
  // SECTION: State Export
  // ============================================================================

  getGameState() {
    return {
      phase: this.currentPhase,
      players: this.players,
      votes: this.votes,
      voteResults: this.voteResults, // Include results in state
      connectedPlayers: Array.from(this.connectedPlayers),
      eliminatedPlayers: Array.from(this.eliminatedPlayers),
      conversationHistory: this.conversationHistory,
      activeSpeaker: this.activeSpeaker,
      roundEndTime: this.roundEndTime,
      eliminationRevealTime: this.eliminationRevealTime, // For client-side countdown
      conversationBlocked: this.conversationBlocked,
      awaitingHumanResponse: this.awaitingHumanResponse
    };
  }
}
