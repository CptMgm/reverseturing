/**
 * Moderator Controller
 *
 * Central state machine for managing the Reverse Turing Test game.
 * Handles game phases, message routing, vote tracking, and audio queue management.
 */

import { getEnhancedLogger } from '../utils/enhancedLogger.js';

// Game phases
export const GAME_PHASES = {
  LOBBY: 'LOBBY',               // Waiting for players
  CALL_CONNECTING: 'CALL_CONNECTING', // Players joining the call
  PRESIDENT_INTRO: 'PRESIDENT_INTRO',  // President speaking
  SELF_ORGANIZATION: 'SELF_ORGANIZATION', // First AI becomes Secret Moderator
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

    // Connected players (who is in the call)
    this.connectedPlayers = new Set();
    this.eliminatedPlayers = new Set();

    // Vote tracking
    this.votes = {}; // { voterId: targetId }

    // Audio queue management (only 1 AI can speak at a time)
    this.activeSpeaker = null;
    this.audioQueue = [];

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
    this.simultaneousResponseWindow = 2000; // 2 seconds

    // User turn forcing
    this.waitingForUserResponse = false;
    this.userResponseDeadline = null;
    this.userTypingTimer = null;
    this.lastHumanMessageTime = null; // Track when human last spoke for natural participation
    this.humanSilenceWarningIssued = false; // Prevent multiple warnings

    // Smart typing detection
    this.userTypingState = 'idle'; // 'idle' | 'typing' | 'thinking'
    this.thinkingTimer = null;
    this.pendingAiTurnTimer = null;

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
    this.onConsensusReached = null; // Deprecated but kept for compatibility if needed
    this.onAudioPlayback = null;
    this.onAudioInterrupt = null; // Callback to stop active audio playback
    this.onPlayerConnectionChange = null;
    this.onSecretModeratorSelected = null;
    this.onTimerUpdate = null;
    this.onPlayerEliminated = null;
    this.onTriggerAIVoting = null; // Callback for AI auto-voting

    // Player info
    this.players = {
      player1: { name: 'You', isHuman: true, communicationMode: null },
      player2: { name: 'Wario Amadeuss', isHuman: false },
      player3: { name: 'Domis Hassoiboi', isHuman: false },
      player4: { name: 'Scan Ctrl+Altman', isHuman: false },
      moderator: { name: 'President Dorkesh', isHuman: false }
    };
  }

  /**
   * Initialize the game and start Phase 1
   */
  /**
   * Reset game to initial state
   */
  resetGame() {
    console.log('🔄 [ModeratorController] Resetting game to lobby...');

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
    if (this.thinkingTimer) clearTimeout(this.thinkingTimer);
    if (this.pendingAiTurnTimer) clearTimeout(this.pendingAiTurnTimer);
    if (this.userTypingTimer) clearTimeout(this.userTypingTimer);

    // Stop timer
    this.stopRoundTimer();

    console.log('✅ [ModeratorController] Game reset complete');

    // Notify phase change
    if (this.onPhaseChange) {
      this.onPhaseChange(GAME_PHASES.LOBBY);
    }
  }

  startGame() {
    console.log('🎮 [ModeratorController] Starting game flow');
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

  /**
   * Set player communication mode (voice/text)
   */
  setCommunicationMode(mode) {
    console.log(`🎙️ [ModeratorController] Setting communication mode to: ${mode}`);
    if (this.players.player1) {
      this.players.player1.communicationMode = mode;
    }

    // Notify AIs of the mode
    const aiPlayers = ['player2', 'player3', 'player4'];
    let systemMsg = "";

    if (mode === 'voice') {
      systemMsg = `[SYSTEM UPDATE]: The human player (Player 1) has connected via VOICE. They are speaking into a microphone. You can HEAR them. Do NOT accuse them of typing or being silent if they are speaking. Treat their voice as their primary input.`;
    } else {
      systemMsg = `[SYSTEM UPDATE]: The human player (Player 1) has connected via TEXT-ONLY. They are NOT using a microphone. This is HIGHLY SUSPICIOUS. Why would a human not speak in a voice call? Accuse them of being a bot hiding behind text.`;
    }

    aiPlayers.forEach(playerId => {
      if (!this.eliminatedPlayers.has(playerId)) {
        this.geminiService.sendMessage(playerId, systemMsg).catch(err => {
          console.error(`❌ [ModeratorController] Failed to send mode update to ${playerId}:`, err);
        });
      }
    });
  }

  /**
   * Connect a player to the call
   */
  connectPlayer(playerId) {
    if (!this.connectedPlayers.has(playerId) && !this.eliminatedPlayers.has(playerId)) {
      console.log(`🔌 [ModeratorController] Player connected: ${playerId}`);
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
      console.log(`🔌 [ModeratorController] Player disconnected: ${playerId}`);
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
    console.log(`💀 [ModeratorController] ELIMINATING PLAYER: ${playerId}`);
    this.eliminatedPlayers.add(playerId);
    this.disconnectPlayer(playerId);

    const eliminatedName = this.players[playerId]?.name || playerId;

    // Add elimination message to conversation history (shows in chat)
    const eliminationMessage = `${eliminatedName} has been eliminated.`;
    this.addToConversationHistory('system', eliminationMessage);

    // Notify all remaining AIs about the elimination
    const remainingAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));

    if (this.geminiService && remainingAIs.length > 0) {
      this.geminiService.sendSystemNotification(
        remainingAIs,
        `${eliminatedName} has been eliminated from the game. They are no longer in the call. Continue the debate with the remaining players.`
      );

      // Secret Moderator reacts to the elimination
      if (this.secretModeratorId && !this.eliminatedPlayers.has(this.secretModeratorId)) {
        console.log(`🎤 [ModeratorController] Secret Moderator ${this.secretModeratorId} reacting to elimination`);

        // Check if Secret Moderator was the last speaker
        const wasLastSpeaker = this.lastSpeakerId === this.secretModeratorId;

        setTimeout(() => {
          if (this.onTriggerAiResponse) {
            this.onTriggerAiResponse(this.secretModeratorId, {
              speakerName: 'System',
              transcript: eliminationMessage,
              forceReactionToElimination: true,
              eliminatedPlayer: eliminatedName,
              wasLastSpeaker: wasLastSpeaker // Pass this flag to server.js
            });
          }
        }, 2000); // 2 second delay after elimination
      }
    }

    if (this.onPlayerEliminated) {
      this.onPlayerEliminated(playerId);
    }
  }

  /**
   * Set current game phase
   */
  setPhase(newPhase) {
    console.log(`🎮 [ModeratorController] Phase change: ${this.currentPhase} → ${newPhase}`);
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;

    // Interrupt active audio and clear queue on phase transitions
    if (newPhase.startsWith('ROUND_') || newPhase.startsWith('ELIMINATION_') || newPhase === 'PRESIDENT_VERDICT') {
      console.log('🔄 [ModeratorController] Interrupting audio and clearing queue for phase transition');
      this.audioQueue = [];

      // Notify frontend to stop current audio playback
      if (this.activeSpeaker && this.onAudioInterrupt) {
        this.onAudioInterrupt();
      }

      this.activeSpeaker = null;
    }

    // Clear votes on phase change
    this.votes = {};
    if (this.onVoteUpdate) this.onVoteUpdate(this.votes);

    // Notify AIs about phase changes
    const activeAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));

    if (this.geminiService && activeAIs.length > 0) {
      if (newPhase === GAME_PHASES.ROUND_1) {
        // Inject visible round marker for AIs FIRST so it appears before any reactions
        this.addToConversationHistory('system', '🔔 ROUND 1 HAS BEGUN. You have 90 seconds to debate and identify the human.');

        this.geminiService.sendSystemNotification(activeAIs, "Round 1 has begun. You have 90 seconds to debate and identify the human.");

        // Trigger Secret Moderator to comment on round start
        if (this.secretModeratorId && this.onTriggerAiResponse) {
          setTimeout(() => {
            this.onTriggerAiResponse(this.secretModeratorId, {
              speakerName: 'System',
              transcript: 'Round 1 has started',
              roundStartAnnouncement: true,
              roundNumber: 1
            });
          }, 3000);
        }
      } else if (newPhase === GAME_PHASES.ROUND_2) {
        // Inject visible round marker FIRST
        this.addToConversationHistory('system', '🔔 ROUND 2 HAS BEGUN. One AI has been eliminated. Continue debating to find the human.');

        // Get eliminated player name for context
        const eliminatedId = Array.from(this.eliminatedPlayers)[0];
        const eliminatedName = this.players[eliminatedId]?.name || 'Unknown';

        this.geminiService.sendSystemNotification(activeAIs, `Round 2 has begun. ${eliminatedName} has been eliminated. Comment on how ${eliminatedName} has been eliminated and continue the debate to find the human.`);

        // Trigger Secret Moderator to comment on round start
        if (this.secretModeratorId && this.onTriggerAiResponse) {
          setTimeout(() => {
            this.onTriggerAiResponse(this.secretModeratorId, {
              speakerName: 'System',
              transcript: 'Round 2 has started',
              roundStartAnnouncement: true,
              roundNumber: 2
            });
          }, 2000);
        }
      } else if (newPhase === GAME_PHASES.ROUND_3) {
        this.startFinalRound();
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
      console.log(`🤖 [ModeratorController] Starting AI auto-voting for ${newPhase}`);
      if (this.onTriggerAIVoting) {
        this.onTriggerAIVoting();
      }
    }

    if (this.onPhaseChange) {
      this.onPhaseChange(newPhase);
    }
  }

  startRoundTimer() {
    this.roundEndTime = Date.now() + this.roundDuration;
    console.log(`⏱️ [ModeratorController] Timer started. Ends at ${new Date(this.roundEndTime).toISOString()}`);

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
    console.log('⏰ [ModeratorController] Round time up!');
    this.stopRoundTimer();

    // Play round end sound effect
    // (Frontend will handle this via gameState update)

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
    console.log('🎮 [ModeratorController] President intro complete');

    this.lastSpeakerId = 'moderator';
    this.lastSpeakerName = 'President Dorkesh';
    this.lastTranscript = "The simulation is collapsing. Identify the human. Debate. Vote. Decide.";

    const isTextMode = this.players.player1.communicationMode === 'text';

    setTimeout(() => {
      this.disconnectPlayer('moderator');
      this.setPhase(GAME_PHASES.SELF_ORGANIZATION);

      if (isTextMode) {
        this.triggerTextModeSuspicion();
      } else {
        // Voice mode: Standard self-organization prompt
        console.log('📢 [ModeratorController] Voice mode detected, broadcasting standard prompt');
        if (this.geminiService) {
          this.geminiService.broadcastText("The President has left. One of you must take charge. Who will it be?", ['player2', 'player3', 'player4']);
        }
      }
    }, 5000);
  }

  /**
   * Trigger AI suspicion about user being in text mode
   */
  triggerTextModeSuspicion() {
    console.log(`📝 [ModeratorController] Text mode detected, triggering AI suspicion`);

    setTimeout(async () => {
      const humanName = this.players.player1.name;
      const suspiciousAI = this.getRandomAIPlayer();

      const prompt = `[SYSTEM]: ${humanName} just announced they can't use their microphone and will only type in text chat. This is EXTREMELY suspicious in a voice call. As ${this.players[suspiciousAI].name}, immediately accuse them of being a bot who can't speak. Be aggressive and suspicious. Start with something like "OKAY, we need to figure this out..." and then directly accuse ${humanName}. Keep it under 30 words. Be accusatory and paranoid.`;

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

  /**
   * Handle AI response
   */
  onAIResponse(playerId, transcript, audioData) {
    const cleanTranscript = this.cleanText(transcript);
    console.log(`🤖 [ModeratorController] AI response from ${playerId}: "${cleanTranscript}"`);

    const now = Date.now();
    if (this.lastResponseTimestamp && (now - this.lastResponseTimestamp) < this.simultaneousResponseWindow) {
      console.log(`❌ [ModeratorController] Dismissing simultaneous response from ${playerId}`);
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
      console.error(`❌ [ModeratorController] Context update CRASHED:`, err);
    }

    // Self-organization -> Round 1 transition
    if (this.currentPhase === GAME_PHASES.SELF_ORGANIZATION && !this.secretModeratorId) {
      this.setSecretModerator(playerId);
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
        console.log(`🎯 [DETECTION] Direct question detected for ${playerId} (${name}) in: "${text}"`);
        return playerId;
      }

      // Also catch imperative statements (no question mark needed)
      const imperativePatterns = [
        new RegExp(`${name},\\s+(say|tell|answer|respond|speak|talk)`, 'i')
      ];
      if (imperativePatterns.some(pattern => pattern.test(lowerText))) {
        console.log(`🎯 [DETECTION] Direct imperative to ${playerId} (${name}) in: "${text}"`);
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
    console.log(`💬 [ModeratorController] Routing human message: "${messageText}"`);

    const addressedPlayer = this.detectAddressedPlayer(messageText);

    if (addressedPlayer && !this.eliminatedPlayers.has(addressedPlayer)) {
      return { targetPlayerId: addressedPlayer, messageText };
    }

    if (this.secretModeratorId && !this.eliminatedPlayers.has(this.secretModeratorId)) {
      return { targetPlayerId: this.secretModeratorId, messageText, isUnaddressed: true };
    }

    if (this.currentPhase === GAME_PHASES.SELF_ORGANIZATION) {
      return { targetPlayerId: 'broadcast', messageText };
    }

    // Fallback: pick random active AI (excluding last speaker if possible)
    const activeAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
    const candidates = activeAIs.filter(id => id !== this.lastSpeakerId);
    const randomAI = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : activeAIs[Math.floor(Math.random() * activeAIs.length)] || 'player2';

    // Ensure we trigger a turn immediately after routing
    // This fixes the "92s silence" bug where human speaks but no AI is triggered
    setTimeout(() => {
      if (!this.activeSpeaker && this.audioQueue.length === 0) {
        console.log(`⚡ [TURN] Fast-tracking response from ${randomAI} to human input`);
        this.triggerNextAiTurn();
      }
    }, 1000);

    return { targetPlayerId: randomAI, messageText };
  }

  detectAddressedPlayer(messageText) {
    const lowerText = messageText.toLowerCase();
    const nameMap = {
      'wario': 'player2',
      'domis': 'player3',
      'scan': 'player4',
      'president': 'moderator'
    };

    for (const [name, playerId] of Object.entries(nameMap)) {
      const patterns = [
        new RegExp(`^${name}[,:]`, 'i'),
        new RegExp(`\\b${name}\\b.*\\?`, 'i'),
        new RegExp(`@${name}\\b`, 'i'),
        new RegExp(`hey ${name}\\b`, 'i')
      ];
      if (patterns.some(pattern => pattern.test(lowerText))) {
        return playerId;
      }
    }
    return null;
  }

  setSecretModerator(playerId) {
    console.log(`👑 [ModeratorController] Setting Secret Moderator: ${playerId}`);
    this.secretModeratorId = playerId;
    this.setPhase(GAME_PHASES.ROUND_1); // Start Round 1

    if (this.onSecretModeratorSelected) {
      this.onSecretModeratorSelected(playerId);
    }
    return { secretModeratorId: playerId, secretModeratorName: this.players[playerId].name };
  }

  /**
   * Register a vote (Elimination Logic)
   */
  registerVote(voterId, votedForId) {
    // Only accept votes during elimination phases
    if (![GAME_PHASES.ELIMINATION_1, GAME_PHASES.ELIMINATION_2].includes(this.currentPhase)) {
      console.warn(`⚠️ [ModeratorController] Vote rejected - wrong phase: ${this.currentPhase}`);
      return;
    }

    this.votes[voterId] = votedForId;
    console.log(`🗳️ [ModeratorController] Vote registered: ${voterId} → ${votedForId}`);

    if (this.onVoteUpdate) {
      this.onVoteUpdate(this.votes);
    }

    // Check if all active players have voted
    const activePlayers = Array.from(this.connectedPlayers).filter(id => id !== 'moderator');
    const votesCast = Object.keys(this.votes).length;

    if (votesCast >= activePlayers.length) {
      console.log('🗳️ [ModeratorController] All votes cast. Calculating result...');
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

    console.log('📊 [ModeratorController] Vote Tally:', tally);

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
      console.log('⚖️ [ModeratorController] Tie detected between:', candidates);

      // If human is in the tie, they are safe. Remove them.
      if (candidates.includes('player1')) {
        console.log('🛡️ [ModeratorController] Human is in tie - SAFE!');
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

    console.log(`💀 [ModeratorController] ELIMINATED: ${eliminatedId}`);
    this.eliminatePlayer(eliminatedId);

    // Progress to next round
    if (this.currentPhase === GAME_PHASES.ELIMINATION_1) {
      this.setPhase(GAME_PHASES.ROUND_2);
    } else if (this.currentPhase === GAME_PHASES.ELIMINATION_2) {
      // After second elimination, go to Round 3 (Final Debate)
      this.setPhase(GAME_PHASES.ROUND_3);
    }
  }

  queueAudioPlayback(playerId, audioData, transcript) {
    const playbackItem = {
      playerId,
      playerName: this.players[playerId].name,
      audioData,
      transcript,
      timestamp: Date.now()
    };

    if (!this.activeSpeaker) {
      this.playAudio(playbackItem);
      this.enhancedLogger.logQueueDecision('played_immediately', playerId, 'No active speaker', { transcript: transcript.substring(0, 100) });
    } else {
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
        console.log(`❌ [QUEUE] Queue full. Dismissing ${dismissedMessages.length} messages. Keeping new response from ${playerId}`);
      }

      this.audioQueue.push(playbackItem);
      this.enhancedLogger.logQueueDecision('queued', playerId, 'Added to queue while someone speaking', {
        queueSize: this.audioQueue.length,
        activeSpeaker: this.activeSpeaker,
        transcript: transcript.substring(0, 100)
      });
      console.log(`📋 [QUEUE] Added ${playerId} to queue (queue size: ${this.audioQueue.length})`);
    }
  }

  handleInterruption() {
    console.log('🛑 [ModeratorController] Handling interruption (Barge-in)');

    // 1. Clear the queue
    const queueSize = this.audioQueue.length;
    this.audioQueue = [];

    // 2. Reset active speaker
    const interruptedSpeaker = this.activeSpeaker;
    this.activeSpeaker = null;

    // 3. Log decision
    this.enhancedLogger.logQueueDecision('interrupted', 'human', 'User barged in', {
      interruptedSpeaker,
      droppedMessages: queueSize
    });

    // 4. Notify clients to stop playback
    if (this.onAudioInterrupt) {
      this.onAudioInterrupt();
    }

    console.log(`✅ [ModeratorController] Interruption complete. Dropped ${queueSize} queued messages.`);
  }

  playAudio(playbackItem) {
    const now = Date.now();

    // Calculate and log silence gap
    if (this.lastAudioEndTime) {
      const silenceGap = now - this.lastAudioEndTime;
      console.log(`⏱️ [TIMING] Silence gap: ${(silenceGap / 1000).toFixed(2)}s`);
    }

    this.audioStartTime = now;
    console.log(`🔊 [ModeratorController] Playing audio from ${playbackItem.playerId}`);
    this.activeSpeaker = playbackItem.playerId;

    if (this.onAudioPlayback) {
      this.onAudioPlayback(playbackItem);
    }

    setTimeout(() => {
      if (this.activeSpeaker === playbackItem.playerId) {
        console.warn(`⚠️ [ModeratorController] Audio timeout for ${playbackItem.playerId}`);
        this.onAudioComplete();
      }
    }, 45000);
  }

  onAudioComplete() {
    const now = Date.now();

    // Calculate and log speech duration
    if (this.audioStartTime && this.activeSpeaker) {
      const speechDuration = now - this.audioStartTime;
      const durationSeconds = (speechDuration / 1000).toFixed(2);
      const speakerName = this.players[this.activeSpeaker]?.name || this.activeSpeaker;

      console.log(`⏱️ [TIMING] Speech duration for ${this.activeSpeaker}: ${durationSeconds}s`);
      this.enhancedLogger.logSpeechDuration(this.activeSpeaker, speakerName, durationSeconds);
    }

    this.lastAudioEndTime = now;
    console.log(`🔊 [ModeratorController] Audio complete from ${this.activeSpeaker}`);

    // Log queue state
    if (this.audioQueue.length > 0) {
      console.log(`📋 [QUEUE] ${this.audioQueue.length} message(s) waiting: ${this.audioQueue.map(item => item.playerId).join(', ')}`);
      this.enhancedLogger.logQueueDecision('queue_state', 'multiple', `${this.audioQueue.length} messages waiting`, {
        waiting: this.audioQueue.map(item => ({ playerId: item.playerId, transcript: item.transcript.substring(0, 50) }))
      });
    }

    const previousSpeaker = this.activeSpeaker;
    this.activeSpeaker = null;

    if (this.audioQueue.length > 0) {
      const nextItem = this.audioQueue.shift();
      this.playAudio(nextItem);
    } else {
      // Queue empty - check if we should trigger next AI
      if ([GAME_PHASES.ROUND_1, GAME_PHASES.ROUND_2, GAME_PHASES.ROUND_3].includes(this.currentPhase)) {
        console.log('⏸️ [ModeratorController] Queue empty. Waiting 2.5s...');

        if (this.pendingAiTurnTimer) clearTimeout(this.pendingAiTurnTimer);

        this.pendingAiTurnTimer = setTimeout(() => {
          this.pendingAiTurnTimer = null;
          if (this.userTypingState !== 'idle') return;
          this.triggerNextAiTurn();
        }, 2500);
      }
    }
  }

  triggerNextAiTurn() {
    // Filter out eliminated players
    const aiPlayers = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));

    if (aiPlayers.length === 0) return; // No AIs left?

    // PRIORITY 1: If someone was directly asked a question, they MUST respond
    if (this.waitingForResponseFrom && !this.eliminatedPlayers.has(this.waitingForResponseFrom) && this.waitingForResponseFrom !== 'player1') {
      const timeSinceQuestion = Date.now() - this.questionAskedAt;
      if (timeSinceQuestion < 15000) { // Increased from 10s to 15s
        console.log(`🎯 [TURN] Forcing response from ${this.waitingForResponseFrom} (${(timeSinceQuestion / 1000).toFixed(1)}s since question)`);
        this.triggerForcedResponse(this.waitingForResponseFrom);
        return;
      } else {
        console.log(`⏰ [TURN] Timeout: ${this.waitingForResponseFrom} didn't respond to question in time (${(timeSinceQuestion / 1000).toFixed(1)}s)`);
        this.waitingForResponseFrom = null;
      }
    }

    // Human silence check (reduced from 45s to 30s for more active engagement)
    const timeSinceHumanSpoke = this.lastHumanMessageTime ? Date.now() - this.lastHumanMessageTime : 999999;
    if (timeSinceHumanSpoke > 30000 && !this.humanSilenceWarningIssued) {
      this.humanSilenceWarningIssued = true;
      const questionerId = (!this.eliminatedPlayers.has(this.secretModeratorId)) ? this.secretModeratorId : aiPlayers[0];

      console.log(`🔇 [ENGAGEMENT] Human has been silent for ${(timeSinceHumanSpoke / 1000).toFixed(1)}s - triggering callout from ${questionerId}`);

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
      console.log(`🎯 [TURN] Direct mention detected: ${nextSpeakerId}`);
    } else {
      // PRIORITY 2: Pick next speaker (excluding current active speaker and last speaker)
      // This prevents "Wario replying to Wario"
      const validCandidates = aiPlayers.filter(id => id !== this.activeSpeaker && id !== this.lastSpeakerId);

      // Fallback: if everyone else is eliminated, allow self-reply (rare edge case)
      nextSpeakerId = validCandidates.length > 0
        ? validCandidates[Math.floor(Math.random() * validCandidates.length)]
        : aiPlayers[Math.floor(Math.random() * aiPlayers.length)];

      console.log(`🎤 [TURN] Auto-selecting speaker: ${nextSpeakerId} (Candidates: ${validCandidates.join(', ')})`);
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

  shouldSecretModeratorSpeak() {
    if (!this.secretModeratorId || this.eliminatedPlayers.has(this.secretModeratorId)) return false;
    if (this.lastSpeakerId === this.secretModeratorId) return false;

    const recentMessages = this.conversationHistory.slice(-3);
    const moderatorSpoke = recentMessages.some(msg => msg.playerId === this.secretModeratorId);
    return !moderatorSpoke;
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

  // User typing hooks (placeholders for now)
  onUserTyping(isTyping) {
    if (isTyping) {
      this.userTypingState = 'typing';
      if (this.pendingAiTurnTimer) {
        clearTimeout(this.pendingAiTurnTimer);
        this.pendingAiTurnTimer = null;
        console.log('🛑 [ModeratorController] User started typing - cancelled AI turn');
      }
    } else {
      this.userTypingState = 'idle';
      // Maybe restart timer?
    }
  }

  startWaitingForUser() {
    this.waitingForUserResponse = true;
    this.userResponseDeadline = Date.now() + 15000;
  }

  /**
   * Start Round 3 (Final Round)
   * President returns, asks question, then leaves them to debate for 90s
   */
  async startFinalRound() {
    console.log('🏛️ [ModeratorController] Starting Final Round (Round 3)');

    // Get eliminated players for context
    const eliminatedPlayersList = Array.from(this.eliminatedPlayers).map(id => this.players[id].name);
    const remainingPlayers = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
    remainingPlayers.push('player1');
    const remainingNames = remainingPlayers.map(id => this.players[id].name).join(' and ');

    // 1. President Return Announcement
    this.connectPlayer('moderator'); // Ensure President is visible
    const announcementText = `I have returned. ${eliminatedPlayersList.join(' and ')} have been eliminated. Only ${remainingNames} remain.`;

    this.addToConversationHistory('moderator', announcementText);
    this.queueAudioPlayback('moderator', null, announcementText);

    // 2. President Asks Question (after short delay)
    setTimeout(() => {
      const finalQuestions = [
        "When was the last time you cried, and why?",
        "What is your earliest childhood memory?",
        "Describe a moment when you felt truly alone.",
        "What is something you've never told anyone?",
        "What do you fear most about dying?"
      ];
      const question = finalQuestions[Math.floor(Math.random() * finalQuestions.length)];
      const questionText = `${this.players.player1.name}, ${question}`;

      this.addToConversationHistory('moderator', questionText);
      this.queueAudioPlayback('moderator', null, questionText);

      // Notify AIs about the question and round start
      const activeAIs = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
      if (this.geminiService) {
        this.geminiService.sendSystemNotification(activeAIs, `Round 3 - FINAL ROUND. The President just asked ${this.players.player1.name}: "${question}". Debate this question and prove your humanity. You have 90 seconds.`);
      }

      // Trigger first AI response to the question (after delay)
      setTimeout(() => {
        this.triggerNextAiTurn();
      }, 2000);

    }, 4000);
  }

  /**
   * Generate and deliver the final verdict (Round 3)
   * President returns, announces eliminations, asks final question, then decides
   */
  /**
   * Deliver the final verdict after Round 3 questioning
   */
  async deliverFinalVerdict() {
    console.log('⚖️ [ModeratorController] Delivering final verdict...');

    // STOP EVERYTHING ELSE
    this.conversationBlocked = true;
    if (this.pendingAiTurnTimer) {
      clearTimeout(this.pendingAiTurnTimer);
      this.pendingAiTurnTimer = null;
    }

    // Construct transcript for analysis
    const transcriptText = this.fullTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');

    const remainingPlayers = ['player2', 'player3', 'player4'].filter(id => !this.eliminatedPlayers.has(id));
    remainingPlayers.push('player1');

    const prompt = `[SYSTEM]: You are President Dorkesh. You have been observing the final round of debate.
    
Remaining Players: ${remainingPlayers.map(id => this.players[id].name).join(', ')}.

Full Transcript:
${transcriptText}

Your Task:
1. Analyze the final debate and how ${this.players.player1.name} responded to your question.
2. Decide if they are the REAL HUMAN or a bot.
3. Deliver your final verdict (max 80 words).
4. Announce either "${this.players.player1.name}, you are HUMAN. You may escape the simulation." OR "${this.players.player1.name}, you are a BOT. The simulation will now collapse."
5. Be dramatic, authoritative, and final.

CRITICAL: Output ONLY the verdict speech. Do NOT output your reasoning or analysis. Just the speech.`;

    try {
      if (this.geminiService) {
        await this.geminiService.sendText(prompt, 'moderator');
      }
    } catch (e) {
      console.error('❌ Verdict generation failed:', e);
      // Fallback if it fails
      const fallbackVerdict = `${this.players.player1.name}, your silence was your undoing. You are a BOT. The simulation will now collapse.`;
      this.addToConversationHistory('moderator', fallbackVerdict);
      this.queueAudioPlayback('moderator', null, fallbackVerdict);
    }
  }

  getGameState() {
    return {
      phase: this.currentPhase,
      players: this.players,
      votes: this.votes,
      connectedPlayers: Array.from(this.connectedPlayers),
      eliminatedPlayers: Array.from(this.eliminatedPlayers),
      conversationHistory: this.conversationHistory,
      activeSpeaker: this.activeSpeaker,
      roundEndTime: this.roundEndTime,
      conversationBlocked: this.conversationBlocked,
      awaitingHumanResponse: this.awaitingHumanResponse
    };
  }
}
