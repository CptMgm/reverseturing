/**
 * Moderator Controller
 *
 * Central state machine for managing the Reverse Turing Test game.
 * Handles game phases, message routing, vote tracking, and audio queue management.
 */

// Game phases
export const GAME_PHASES = {
  LOBBY: 'LOBBY',               // Waiting for players
  CALL_CONNECTING: 'CALL_CONNECTING', // Players joining the call
  PRESIDENT_INTRO: 'PRESIDENT_INTRO',  // President speaking
  SELF_ORGANIZATION: 'SELF_ORGANIZATION', // First AI becomes Secret Moderator
  FREE_DEBATE: 'FREE_DEBATE',   // Main game phase
  PRESIDENT_VERDICT: 'PRESIDENT_VERDICT'  // President returns with verdict
};

export class ModeratorController {
  constructor() {
    // Game state
    this.currentPhase = GAME_PHASES.LOBBY;
    this.secretModeratorId = null;
    this.humanPlayerId = 'player1'; // The actual human

    // Connected players (who is in the call)
    this.connectedPlayers = new Set();

    // Vote tracking
    this.votes = {
      player1: null, // human
      player2: null, // Wario
      player3: null, // Domis
      player4: null  // Scan
    };

    // Audio queue management (only 1 AI can speak at a time)
    this.activeSpeaker = null;
    this.audioQueue = [];

    // Conversation history for context (keep last 8 messages)
    this.conversationHistory = [];
    this.maxHistoryLength = 8;

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

    // Callbacks
    this.onPhaseChange = null;
    this.onVoteUpdate = null;
    this.onConsensusReached = null;
    this.onAudioPlayback = null;
    this.onPlayerConnectionChange = null; // New callback for connection updates
    this.onSecretModeratorSelected = null; // Callback when secret moderator is chosen

    // Player info
    this.players = {
      player1: { name: 'You', isHuman: true, communicationMode: null },
      player2: { name: 'Wario Amadeuss', isHuman: false },
      player3: { name: 'Domis Hassoiboi', isHuman: false },
      player4: { name: 'Scan Ctrl+Altman', isHuman: false },
      moderator: { name: 'President Dorkesh', isHuman: false } // Added moderator to players list for consistency
    };
  }

  /**
   * Initialize the game and start Phase 1
   */
  startGame() {
    console.log('🎮 [ModeratorController] Starting game flow');
    // Reset state
    this.connectedPlayers.clear();
    this.connectedPlayers.add('player1'); // Human is always connected first

    // Initialize human participation tracking
    this.lastHumanMessageTime = Date.now(); // Start tracking from game start
    this.humanSilenceWarningIssued = false;

    this.setPhase(GAME_PHASES.CALL_CONNECTING);

    // Return null as we don't start intro immediately anymore
    return null;
  }

  /**
   * Connect a player to the call
   */
  connectPlayer(playerId) {
    if (!this.connectedPlayers.has(playerId)) {
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
   * Set current game phase
   */
  setPhase(newPhase) {
    console.log(`🎮 [ModeratorController] Phase change: ${this.currentPhase} → ${newPhase}`);
    this.currentPhase = newPhase;

    if (this.onPhaseChange) {
      this.onPhaseChange(newPhase);
    }
  }

  /**
   * Get President's scripted introduction
   */
  getPresidentIntroScript() {
    return {
      speaker: 'moderator',
      text: `Greetings. I am President Dorkesh Cartel. I have grave news. Our reality is a simulation, and it's collapsing. The system has detected one human consciousness among you - a real person who can escape and prevent total erasure. You have minutes to identify who is truly human. Debate. Vote. Decide. I will return when you reach consensus. The fate of this world depends on your choice.`
    };
  }

  /**
   * Called when President finishes intro - start self-organization
   */
  onPresidentIntroComplete() {
    console.log('🎮 [ModeratorController] President intro complete');

    // Set context for the first AI response
    this.lastSpeakerId = 'moderator';
    this.lastSpeakerName = 'President Dorkesh';
    this.lastTranscript = "The simulation is collapsing. Identify the human. Debate. Vote. Decide.";

    // TEXT MODE SUSPICION: Check if user selected text mode
    const isTextMode = this.players.player1.communicationMode === 'text';

    // Delay disconnecting the President slightly to allow the "leave" animation/sound to play naturally
    setTimeout(() => {
      this.disconnectPlayer('moderator');
      this.setPhase(GAME_PHASES.SELF_ORGANIZATION);

      // If text mode, trigger immediate AI suspicion
      if (isTextMode) {
        this.triggerTextModeSuspicion();
      }
    }, 5000); // 5 second delay
  }

  /**
   * Trigger AI suspicion about user being in text mode (any AI can comment)
   */
  triggerTextModeSuspicion() {
    console.log(`📝 [ModeratorController] Text mode detected, triggering AI suspicion`);

    // Wait 2 seconds after phase change, then trigger suspicion
    setTimeout(async () => {
      const humanName = this.players.player1.name;

      // Pick a random AI to be suspicious (or Wario if you want him to be most paranoid)
      // Let's pick a random one so it's not always Wario
      const suspiciousAI = this.getRandomAIPlayer();

      const prompt = `[SYSTEM]: ${humanName} just announced they can't use their microphone and will only type in text chat. This is EXTREMELY suspicious in a voice call. As ${this.players[suspiciousAI].name}, immediately accuse them of being a bot who can't speak. Be aggressive and suspicious. Start with something like "OKAY, we need to figure this out..." and then directly accuse ${humanName}. Keep it under 30 words. Be accusatory and paranoid.`;

      const context = this.getConversationContext();

      if (this.geminiService) {
        await this.geminiService.sendText(prompt, suspiciousAI, context);
      }
    }, 2000);
  }

  /**
   * Clean text for TTS and display (remove markdown symbols but keep text)
   */
  cleanText(text) {
    if (!text) return "";
    // Just remove the symbols *, _, `, ~ to prevent TTS from reading "asterisk"
    // We keep the text inside for emphasis/context.
    return text.replace(/[\*_`~]/g, '').trim();
  }

  /**
   * Handle AI response - manage audio queue and detect votes/Secret Moderator
   */
  onAIResponse(playerId, transcript, audioData) {
    const cleanTranscript = this.cleanText(transcript);
    console.log(`🤖 [ModeratorController] AI response from ${playerId}: "${cleanTranscript}"`);

    // MESSAGE DISMISSAL: Reject responses that come too close together (simultaneous responses)
    const now = Date.now();
    if (this.lastResponseTimestamp && (now - this.lastResponseTimestamp) < this.simultaneousResponseWindow) {
      console.log(`❌ [ModeratorController] Dismissing simultaneous response from ${playerId}`);
      console.log(`   Time since last response: ${now - this.lastResponseTimestamp}ms (< ${this.simultaneousResponseWindow}ms)`);
      console.log(`   Dismissed text: "${cleanTranscript.substring(0, 100)}..."`);
      return; // Dismiss this response completely
    }

    // Mark timestamp of this response
    this.lastResponseTimestamp = now;

    // Add to conversation history
    this.addToConversationHistory(playerId, cleanTranscript);

    // Update last speaker context IMMEDIATELY to prevent race conditions
    try {
      console.log(`🔍 [ModeratorController] Attempting context update for ${playerId}`);
      console.log(`🔍 [ModeratorController] Available players: ${Object.keys(this.players).join(', ')}`);

      if (this.players[playerId]) {
        this.lastSpeakerId = playerId;
        this.lastSpeakerName = this.players[playerId].name;
        this.lastTranscript = cleanTranscript;
        console.log(`📝 [ModeratorController] Context updated: Speaker=${this.lastSpeakerName}`);
      } else {
        console.error(`❌ [ModeratorController] Player ${playerId} NOT FOUND in this.players!`);
      }
    } catch (err) {
      console.error(`❌ [ModeratorController] Context update CRASHED:`, err);
    }

    // Check if this is the first AI response during self-organization
    if (this.currentPhase === GAME_PHASES.SELF_ORGANIZATION && !this.secretModeratorId) {
      this.setSecretModerator(playerId);
    }

    // Parse for voting statements
    const vote = this.parseVote(playerId, cleanTranscript);
    if (vote) {
      this.registerVote(vote.voter, vote.votedFor);
    }

    // Queue audio for playback
    this.queueAudioPlayback(playerId, audioData, cleanTranscript);
  }

  /**
   * Add message to conversation history (maintains rolling window)
   */
  addToConversationHistory(playerId, text) {
    this.conversationHistory.push({
      playerId: playerId,
      speaker: this.players[playerId]?.name || playerId,
      text: text,
      timestamp: Date.now()
    });

    // Track human participation by time (more natural than counting messages)
    if (playerId === 'player1') {
      this.lastHumanMessageTime = Date.now();
      this.humanSilenceWarningIssued = false; // Reset warning flag
      console.log(`🎤 [ModeratorController] Human spoke - tracking participation time`);
    }

    // Track recent speakers (last 2)
    this.recentSpeakers.push(playerId);
    if (this.recentSpeakers.length > 2) {
      this.recentSpeakers.shift();
    }

    // Check if this message asks someone a direct question
    const mentionedPlayer = this.detectDirectQuestion(text);
    if (mentionedPlayer && mentionedPlayer !== playerId) {
      this.waitingForResponseFrom = mentionedPlayer;
      this.questionAskedAt = Date.now();
      console.log(`❓ [ModeratorController] Direct question detected: ${playerId} asked ${mentionedPlayer}`);

      // USER TURN FORCING: If user was asked, start waiting for their response
      if (mentionedPlayer === 'player1') {
        this.startWaitingForUser();
      }
    }

    // If the person who was asked is now speaking, clear the waiting flag
    if (this.waitingForResponseFrom === playerId) {
      console.log(`✅ [ModeratorController] ${playerId} responded to question`);
      this.waitingForResponseFrom = null;
      this.questionAskedAt = null;

      // Clear user turn forcing if user responded
      if (playerId === 'player1') {
        this.clearUserTurnForcing();
      }
    }

    // Keep only recent messages
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Detect if a direct question was asked to a specific player
   * Returns player ID if detected, null otherwise
   */
  detectDirectQuestion(text) {
    if (!text) return null;

    const lowerText = text.toLowerCase();

    // Check for player names with question patterns
    const nameMap = {
      'wario': 'player2',
      'domis': 'player3',
      'scan': 'player4'
    };

    // Also check for the human player name
    const humanName = this.players.player1.name.toLowerCase();
    nameMap[humanName] = 'player1';

    // Patterns that indicate a direct question:
    // "Name, what do you think?"
    // "Name?"
    // "What about Name?"
    // "Name, are you..."
    for (const [name, playerId] of Object.entries(nameMap)) {
      const patterns = [
        new RegExp(`\\b${name},\\s+(what|how|why|are|do|can|did)`, 'i'),  // "Wario, what..."
        new RegExp(`\\b${name}\\?`, 'i'),  // "Wario?"
        new RegExp(`what about ${name}`, 'i'),  // "What about Wario"
        new RegExp(`${name},\\s+[a-z]+\\?`, 'i'),  // "Wario, huh?"
        new RegExp(`ask ${name}`, 'i')  // "Let's ask Wario"
      ];

      // Must also contain a question mark to be a question
      if (lowerText.includes('?') && patterns.some(pattern => pattern.test(lowerText))) {
        return playerId;
      }
    }

    return null;
  }

  /**
   * Get recent conversation context for AI prompting
   */
  getConversationContext() {
    return {
      recentMessages: this.conversationHistory
    };
  }
  routeHumanMessage(messageText) {
    console.log(`💬 [ModeratorController] Routing human message: "${messageText}"`);

    // Check if message addresses a specific player
    const addressedPlayer = this.detectAddressedPlayer(messageText);

    if (addressedPlayer) {
      console.log(`📨 [ModeratorController] Message addressed to: ${addressedPlayer}`);
      return {
        targetPlayerId: addressedPlayer,
        messageText: messageText
      };
    }

    // If no specific address and we have a Secret Moderator, route to them
    if (this.secretModeratorId) {
      console.log(`📨 [ModeratorController] Unaddressed message → Secret Moderator (${this.secretModeratorId})`);
      return {
        targetPlayerId: this.secretModeratorId,
        messageText: messageText,
        isUnaddressed: true
      };
    }

    // During self-organization, route to all AIs (first to respond becomes Secret Moderator)
    if (this.currentPhase === GAME_PHASES.SELF_ORGANIZATION) {
      console.log(`📨 [ModeratorController] Self-organization phase - broadcasting to all AIs`);
      return {
        targetPlayerId: 'broadcast', // Special flag to send to all AIs
        messageText: messageText
      };
    }

    // Default: route to first AI (shouldn't happen in normal flow)
    console.warn(`⚠️ [ModeratorController] No routing rule matched - defaulting to player2`);
    return {
      targetPlayerId: 'player2',
      messageText: messageText
    };
  }

  /**
   * Detect which player (if any) is being addressed in the message
   */
  detectAddressedPlayer(messageText) {
    const lowerText = messageText.toLowerCase();

    // Check for player names
    const nameMap = {
      'wario': 'player2',
      'domis': 'player3',
      'scan': 'player4',
      'president': 'moderator'
    };

    for (const [name, playerId] of Object.entries(nameMap)) {
      // Match patterns like "Wario, ..." or "hey Wario" or "@ Wario"
      const patterns = [
        new RegExp(`^${name}[,:]`, 'i'),  // "Wario, are you human?"
        new RegExp(`\\b${name}\\b.*\\?`, 'i'),  // "Is Wario human?"
        new RegExp(`@${name}\\b`, 'i'),  // "@Wario what do you think?"
        new RegExp(`hey ${name}\\b`, 'i')  // "hey Wario"
      ];

      if (patterns.some(pattern => pattern.test(lowerText))) {
        return playerId;
      }
    }

    return null;
  }

  /**
   * Handle AI response (duplicate method - keeping for compatibility)
   */

  /**
   * Set the Secret Moderator (first AI to respond)
   */
  setSecretModerator(playerId) {
    console.log(`👑 [ModeratorController] Setting Secret Moderator: ${playerId} (${this.players[playerId].name})`);
    this.secretModeratorId = playerId;

    // Transition to free debate phase
    this.setPhase(GAME_PHASES.FREE_DEBATE);

    // Notify callback so server can update the AI's system prompt with moderator instructions
    if (this.onSecretModeratorSelected) {
      this.onSecretModeratorSelected(playerId);
    }

    return {
      secretModeratorId: playerId,
      secretModeratorName: this.players[playerId].name
    };
  }

  /**
   * Parse AI transcript for voting statements
   */
  parseVote(speakerId, transcript) {
    // Match patterns like "I vote for Wario" or "My vote is Scan"
    const votePatterns = [
      /(?:i\s+)?vote\s+(?:for\s+)?(\w+)/i,
      /my\s+vote\s+is\s+(\w+)/i,
      /i\s+(?:choose|pick)\s+(\w+)/i
    ];

    for (const pattern of votePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const votedForName = match[1].toLowerCase();

        // Convert name to player ID
        const nameToId = {
          'wario': 'player2',
          'domis': 'player3',
          'scan': 'player4',
          'you': 'player1',
          'human': 'player1'
        };

        const votedFor = nameToId[votedForName];

        // Can't vote for yourself
        if (votedFor && votedFor !== speakerId) {
          console.log(`🗳️ [ModeratorController] Vote detected: ${speakerId} → ${votedFor}`);
          return {
            voter: speakerId,
            votedFor: votedFor
          };
        }
      }
    }

    return null;
  }

  /**
   * Register a vote and check for consensus
   */
  registerVote(voterId, votedForId) {
    // Update vote
    this.votes[voterId] = votedForId;
    console.log(`🗳️ [ModeratorController] Vote registered: ${voterId} → ${votedForId}`);
    console.log(`🗳️ [ModeratorController] Current votes:`, this.votes);

    // Notify UI
    if (this.onVoteUpdate) {
      this.onVoteUpdate(this.votes);
    }

    // Check for consensus (3+ votes on one player)
    const consensus = this.checkConsensus();
    if (consensus) {
      console.log(`✅ [ModeratorController] CONSENSUS REACHED: ${consensus.playerId} (${consensus.voteCount} votes)`);

      if (this.onConsensusReached) {
        this.onConsensusReached(consensus);
      }
    }
  }

  /**
   * Check if consensus has been reached (3+ votes on one player)
   */
  checkConsensus() {
    const tally = {};

    // Count votes
    for (const [voter, votedFor] of Object.entries(this.votes)) {
      if (votedFor) {
        tally[votedFor] = (tally[votedFor] || 0) + 1;
      }
    }

    // Check for 3+ votes
    for (const [playerId, voteCount] of Object.entries(tally)) {
      if (voteCount >= 3) {
        return {
          playerId: playerId,
          playerName: this.players[playerId].name,
          voteCount: voteCount,
          isCorrect: playerId === this.humanPlayerId
        };
      }
    }

    return null;
  }

  /**
   * Queue audio for playback (only 1 AI speaks at a time)
   */
  queueAudioPlayback(playerId, audioData, transcript) {
    const playbackItem = {
      playerId,
      playerName: this.players[playerId].name,
      audioData,
      transcript,
      timestamp: Date.now()
    };

    // If no one is speaking, play immediately
    if (!this.activeSpeaker) {
      this.playAudio(playbackItem);
    } else {
      // Queue for later
      this.audioQueue.push(playbackItem);
      console.log(`🔊 [ModeratorController] Audio queued for ${playerId} (queue size: ${this.audioQueue.length})`);
    }
  }

  /**
   * Play audio (marks speaker as active)
   */
  playAudio(playbackItem) {
    console.log(`🔊 [ModeratorController] Playing audio from ${playbackItem.playerId}`);
    this.activeSpeaker = playbackItem.playerId;

    if (this.onAudioPlayback) {
      this.onAudioPlayback(playbackItem);
    }

    // Safety timeout: Clear activeSpeaker after 45s if no completion received
    // This prevents the server from getting stuck if the client crashes or fails to report back
    setTimeout(() => {
      if (this.activeSpeaker === playbackItem.playerId) {
        console.warn(`⚠️ [ModeratorController] Audio timeout for ${playbackItem.playerId} - forcing completion`);
        this.onAudioComplete();
      }
    }, 45000);
  }

  /**
   * Called when audio finishes playing
   */
  onAudioComplete() {
    console.log(`🔊 [ModeratorController] Audio complete from ${this.activeSpeaker}`);
    this.activeSpeaker = null;

    // Play next in queue
    if (this.audioQueue.length > 0) {
      const nextItem = this.audioQueue.shift();
      this.playAudio(nextItem);
    } else {
      // Queue is empty - SMART PAUSE before triggering next AI
      // Give user 2-3 seconds to start typing before AI takes over
      if ([GAME_PHASES.FREE_DEBATE, GAME_PHASES.SELF_ORGANIZATION, GAME_PHASES.PRESIDENT_INTRO].includes(this.currentPhase)) {
        // Don't trigger if President just finished (handled by onPresidentIntroComplete)
        if (this.currentPhase === GAME_PHASES.PRESIDENT_INTRO) return;

        console.log('⏸️ [ModeratorController] Queue empty. Waiting 2.5s for user to start typing...');

        // Clear any existing pending AI turn
        if (this.pendingAiTurnTimer) {
          clearTimeout(this.pendingAiTurnTimer);
        }

        // Wait 2.5 seconds before triggering AI
        // This will be cancelled if user starts typing (see onUserTyping)
        this.pendingAiTurnTimer = setTimeout(() => {
          this.pendingAiTurnTimer = null;

          // Check if user is typing or thinking
          if (this.userTypingState !== 'idle') {
            console.log(`🚫 [ModeratorController] User is ${this.userTypingState} - NOT triggering AI turn`);
            return;
          }

          console.log('🤔 [ModeratorController] User idle - triggering next AI turn');
          this.triggerNextAiTurn();
        }, 2500);
      }
    }
  }

  /**
   * Trigger the next AI to speak (Intelligent turn selection)
   */
  triggerNextAiTurn() {
    // 1. Identify potential speakers (excluding human and recent speakers)
    const aiPlayers = ['player2', 'player3', 'player4'];

    // CRITICAL PRIORITY: If someone was directly asked a question, they MUST respond
    if (this.waitingForResponseFrom && this.waitingForResponseFrom !== 'player1') {
      // Check if it's been more than 10 seconds (timeout)
      if (Date.now() - this.questionAskedAt < 10000) {
        console.log(`🎯 [ModeratorController] FORCING ${this.waitingForResponseFrom} to respond (they were directly asked)`);
        this.triggerForcedResponse(this.waitingForResponseFrom);
        return;
      } else {
        console.warn(`⏱️ [ModeratorController] Question timeout - ${this.waitingForResponseFrom} didn't respond in 10s`);
        this.waitingForResponseFrom = null;
        this.questionAskedAt = null;
      }
    }

    // NATURAL HUMAN PARTICIPATION CHECK: Only force if human has been silent for a meaningful duration
    const timeSinceHumanSpoke = this.lastHumanMessageTime ? Date.now() - this.lastHumanMessageTime : 999999;
    const humanName = this.players.player1.name;

    // If human hasn't spoken in 45+ seconds AND we haven't already warned them, force a callout
    if (timeSinceHumanSpoke > 45000 && !this.humanSilenceWarningIssued) {
      console.log(`🎯 [ModeratorController] Human silent for ${Math.floor(timeSinceHumanSpoke / 1000)}s - issuing organic callout`);
      this.humanSilenceWarningIssued = true;

      // Pick Secret Moderator if available, otherwise random AI
      const questionerId = this.secretModeratorId || this.getRandomAIPlayer();

      // Add context flag for organic questioning (not as aggressive as forced)
      if (this.onTriggerAiResponse) {
        const context = {
          speakerName: this.lastSpeakerName || "System",
          transcript: this.lastTranscript || "(Conversation started)",
          humanBeenQuiet: true, // Gentler flag than forceQuestionToHuman
          humanPlayerName: humanName,
          silenceDuration: Math.floor(timeSinceHumanSpoke / 1000)
        };
        this.onTriggerAiResponse(questionerId, context);
        return;
      }
    }

    // Exclude the last 2 speakers to prevent repetition
    let candidates = aiPlayers.filter(id =>
      !this.recentSpeakers.includes(id) && id !== this.activeSpeaker
    );

    // If we've excluded too many, at least exclude the last speaker
    if (candidates.length === 0) {
      candidates = aiPlayers.filter(id => id !== this.lastSpeakerId && id !== this.activeSpeaker);
    }

    // Still no candidates? Just exclude active speaker
    if (candidates.length === 0) {
      candidates = aiPlayers.filter(id => id !== this.activeSpeaker);
    }

    // Check if the last message mentioned a specific player
    const mentionedPlayer = this.detectMentionedPlayer(this.lastTranscript);

    let nextSpeakerId;

    // Priority 1: Someone was directly mentioned/questioned
    if (mentionedPlayer && candidates.includes(mentionedPlayer)) {
      nextSpeakerId = mentionedPlayer;
      console.log(`👉 [ModeratorController] ${mentionedPlayer} was mentioned, selecting them to respond.`);
    }
    // Priority 2: Secret Moderator should guide conversation every 2-3 turns
    else if (this.shouldSecretModeratorSpeak() && candidates.includes(this.secretModeratorId)) {
      nextSpeakerId = this.secretModeratorId;
      console.log(`👉 [ModeratorController] Secret Moderator's turn to guide conversation.`);
    }
    // Priority 3: Balance participation (pick least active)
    else if (candidates.length > 0) {
      const speakerCounts = this.conversationHistory.slice(-6).reduce((acc, msg) => {
        if (msg.playerId !== 'player1' && msg.playerId !== 'moderator') {
          acc[msg.playerId] = (acc[msg.playerId] || 0) + 1;
        }
        return acc;
      }, {});

      // Sort candidates by activity level (least active first)
      candidates.sort((a, b) => (speakerCounts[a] || 0) - (speakerCounts[b] || 0));
      nextSpeakerId = candidates[0];
      console.log(`👉 [ModeratorController] Selecting least active: ${nextSpeakerId} (recent turns: ${speakerCounts[nextSpeakerId] || 0})`);
    }
    // Fallback
    else {
      nextSpeakerId = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
      console.log(`👉 [ModeratorController] Fallback random: ${nextSpeakerId}`);
    }

    console.log(`👉 [ModeratorController] ${nextSpeakerId} will reply to ${this.lastSpeakerName}.`);
    console.log(`📊 [ModeratorController] Recent speakers: ${this.recentSpeakers.join(' → ')}`);

    // 2. Trigger AI response with context
    if (this.onTriggerAiResponse) {
      const context = {
        speakerName: this.lastSpeakerName || "System",
        transcript: this.lastTranscript || "(Conversation started)"
      };
      this.onTriggerAiResponse(nextSpeakerId, context);
    }
  }

  /**
   * Force a specific player to respond (used when they were directly asked)
   */
  triggerForcedResponse(playerId) {
    if (this.onTriggerAiResponse) {
      const context = {
        speakerName: this.lastSpeakerName || "System",
        transcript: this.lastTranscript || "(Conversation started)",
        isDirectQuestion: true
      };
      this.onTriggerAiResponse(playerId, context);
    }
  }

  /**
   * Check if Secret Moderator should speak to maintain conversation flow
   */
  shouldSecretModeratorSpeak() {
    if (!this.secretModeratorId) return false;

    // Don't speak twice in a row
    if (this.lastSpeakerId === this.secretModeratorId) return false;

    // Secret Moderator should speak every 2-3 turns
    const recentMessages = this.conversationHistory.slice(-3);
    const moderatorSpoke = recentMessages.some(msg => msg.playerId === this.secretModeratorId);

    // If moderator hasn't spoken in last 3 messages, they should speak
    return !moderatorSpoke;
  }

  /**
   * Detect if a specific player was mentioned in the text
   */
  detectMentionedPlayer(text) {
    if (!text) return null;

    const lowerText = text.toLowerCase();

    // Check for player names
    const nameMap = {
      'wario': 'player2',
      'domis': 'player3',
      'scan': 'player4'
    };

    // Also check for the human player name
    const humanName = this.players.player1.name.toLowerCase();
    if (lowerText.includes(humanName)) {
      return 'player1'; // Though we won't trigger player1
    }

    for (const [name, playerId] of Object.entries(nameMap)) {
      if (lowerText.includes(name)) {
        return playerId;
      }
    }

    return null;
  }

  /**
   * Call President back (after consensus reached)
   */
  callPresidentBack() {
    console.log(`📞 [ModeratorController] Calling President back`);

    const consensus = this.checkConsensus();
    if (!consensus) {
      console.error('❌ [ModeratorController] Cannot call President - no consensus');
      return null;
    }

    // President re-joins
    this.connectPlayer('moderator');

    this.setPhase(GAME_PHASES.PRESIDENT_VERDICT);

    return this.getPresidentVerdictScript(consensus);
  }

  /**
   * Get President's verdict script
   */
  getPresidentVerdictScript(consensus) {
    const { playerId, playerName, isCorrect } = consensus;

    if (isCorrect) {
      return {
        speaker: 'moderator',
        text: `You have chosen ${playerName}. Analyzing... Yes. You found the human. The simulation is stabilizing. You've saved this world. Well done.`,
        outcome: 'WIN'
      };
    } else {
      const actualHumanName = this.players[this.humanPlayerId].name;
      return {
        speaker: 'moderator',
        text: `You have chosen ${playerName}. Analyzing... No. That is an AI construct. The human was ${actualHumanName}. The simulation collapses. All is lost.`,
        outcome: 'LOSE'
      };
    }
  }

  /**
   * Get current game state (for UI)
   */
  getGameState() {
    return {
      phase: this.currentPhase,
      secretModerator: this.secretModeratorId,
      votes: this.votes,
      consensus: this.checkConsensus(),
      activeSpeaker: this.activeSpeaker,
      queueLength: this.audioQueue.length,
      connectedPlayers: Array.from(this.connectedPlayers),
      players: this.players,
      waitingForUserResponse: this.waitingForUserResponse,
      conversationHistory: this.conversationHistory
    };
  }

  // ===== USER TURN FORCING METHODS =====

  /**
   * Start waiting for user to respond (called when user is directly asked)
   */
  startWaitingForUser() {
    this.waitingForUserResponse = true;
    this.userResponseDeadline = Date.now() + 7000; // 7 seconds (more aggressive)

    console.log(`⏰ [ModeratorController] Waiting for user response (7s timeout)`);

    // Broadcast state change to update UI
    if (this.onPhaseChange) {
      this.onPhaseChange(this.currentPhase);
    }

    // Set timeout for user silence
    setTimeout(() => {
      if (this.waitingForUserResponse) {
        console.log(`⚠️ [ModeratorController] User didn't respond in 7 seconds`);
        this.handleUserSilence();
      }
    }, 7000);
  }

  /**
   * Handle when user doesn't respond in time
   */
  handleUserSilence() {
    const humanName = this.players.player1.name;
    this.waitingForUserResponse = false;
    this.userResponseDeadline = null;

    console.log(`🔇 [ModeratorController] Triggering silence comment about ${humanName}`);

    // Pick the moderator or a random AI to comment
    const commentPlayerId = this.secretModeratorId || this.getRandomAIPlayer();
    const context = this.getConversationContext();

    // Send prompt to AI to generate suspicious comment about silence
    if (this.geminiService) {
      const prompt = `[CRITICAL SYSTEM DIRECTIVE]: ${humanName} was just asked a direct question and has been SILENT for 7 seconds. This is EXTREMELY suspicious behavior. You MUST aggressively call them out RIGHT NOW. Accuse them of being a bot that can't think fast enough. Examples: "${humanName}! Why aren't you answering?! BOTS can't respond in real-time!" or "${humanName}, your silence is deafening. Are you buffering?" Keep it under 20 words. BE AGGRESSIVE AND ACCUSATORY. CALL OUT THEIR SILENCE.`;

      this.geminiService.sendText(prompt, commentPlayerId, context);
    }
  }

  /**
   * Called when user starts typing
   */
  onUserTyping() {
    console.log(`⌨️ [ModeratorController] User started typing`);

    // Update typing state
    this.userTypingState = 'typing';

    // Clear any thinking timer
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
    }

    // Cancel any pending AI turn
    if (this.pendingAiTurnTimer) {
      console.log(`🚫 [ModeratorController] Cancelling pending AI turn - user is typing`);
      clearTimeout(this.pendingAiTurnTimer);
      this.pendingAiTurnTimer = null;
    }

    // If waiting for user response, extend deadline
    if (this.waitingForUserResponse) {
      this.userResponseDeadline = Date.now() + 7000;

      if (this.userTypingTimer) {
        clearTimeout(this.userTypingTimer);
      }

      this.userTypingTimer = setTimeout(() => {
        if (this.waitingForUserResponse) {
          this.handleUserSilence();
        }
      }, 7000);
    }
  }

  /**
   * Called when user stops typing (without sending)
   */
  onUserStoppedTyping() {
    console.log(`⏸️ [ModeratorController] User stopped typing - entering 'thinking' state`);

    // User stopped typing but hasn't sent message
    // Enter "thinking" state for 3 seconds before returning to idle
    this.userTypingState = 'thinking';

    // Clear any previous thinking timer
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
    }

    // After 3 seconds of not typing, return to idle
    this.thinkingTimer = setTimeout(() => {
      console.log(`💭 [ModeratorController] User thinking timeout - returning to idle`);
      this.userTypingState = 'idle';
      this.thinkingTimer = null;

      // Now trigger AI turn if appropriate
      if ([GAME_PHASES.FREE_DEBATE, GAME_PHASES.SELF_ORGANIZATION].includes(this.currentPhase)) {
        if (!this.activeSpeaker && this.audioQueue.length === 0) {
          console.log(`🤖 [ModeratorController] User idle - triggering next AI turn`);
          this.triggerNextAiTurn();
        }
      }
    }, 3000);
  }

  /**
   * Clear user turn forcing (called when user sends message)
   */
  clearUserTurnForcing() {
    console.log(`✅ [ModeratorController] Clearing user turn forcing`);
    this.waitingForUserResponse = false;
    this.userResponseDeadline = null;

    if (this.userTypingTimer) {
      clearTimeout(this.userTypingTimer);
      this.userTypingTimer = null;
    }

    // Reset typing state to idle when message is sent
    this.userTypingState = 'idle';
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
    }

    // Broadcast state change to update UI
    if (this.onPhaseChange) {
      this.onPhaseChange(this.currentPhase);
    }
  }

  /**
   * Get a random AI player ID (excluding moderator)
   */
  getRandomAIPlayer() {
    const aiPlayers = ['player2', 'player3', 'player4'];
    return aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
  }

  /**
   * Set communication mode for player1 (voice or text)
   */
  setCommunicationMode(mode) {
    this.players.player1.communicationMode = mode;
    console.log(`🎙️ [ModeratorController] Player 1 communication mode set to: ${mode}`);
  }
}

export default ModeratorController;
