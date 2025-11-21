/**
 * Game Orchestrator
 *
 * Integrates ModeratorController and GeminiLiveService to run the full game.
 * Handles the complete flow from President intro through debate to verdict.
 */

import ModeratorController, { GAME_PHASES } from './moderatorController.js';
import { getGeminiLive, initializeGeminiLive } from './geminiLiveService.js';
import { getPlayerPrompt, presidentPrompt } from '../utils/reverseGamePersonas.js';

export class GameOrchestrator {
  constructor(apiKey) {
    // Initialize services
    this.moderatorController = new ModeratorController();
    this.geminiLiveService = initializeGeminiLive(apiKey);

    // Connect services
    this.geminiLiveService.moderatorController = this.moderatorController;

    // Bind callbacks
    this.setupCallbacks();

    // Track game state
    this.isGameStarted = false;
    this.presidentialAudioQueue = [];
  }

  /**
   * Set up callbacks between services and UI
   */
  setupCallbacks() {
    // ModeratorController callbacks
    this.moderatorController.onPhaseChange = (newPhase) => {
      console.log(`🎮 [GameOrchestrator] Phase changed to: ${newPhase}`);
      this.handlePhaseChange(newPhase);
    };

    this.moderatorController.onVoteUpdate = (votes) => {
      console.log(`🗳️ [GameOrchestrator] Votes updated:`, votes);
      // UI will listen to this event
      if (this.onVoteUpdate) {
        this.onVoteUpdate(votes);
      }
    };

    this.moderatorController.onConsensusReached = (consensus) => {
      console.log(`✅ [GameOrchestrator] Consensus reached:`, consensus);
      // Enable "Call President" button
      if (this.onConsensusReached) {
        this.onConsensusReached(consensus);
      }
    };

    this.moderatorController.onAudioPlayback = (playbackItem) => {
      console.log(`🔊 [GameOrchestrator] Playing audio from ${playbackItem.playerId}`);
      // UI plays the audio
      if (this.onAudioPlayback) {
        this.onAudioPlayback(playbackItem);
      }
    };

    // GeminiLiveService callbacks
    this.geminiLiveService.onTranscriptReceived = (playerId, text) => {
      // Update UI transcript
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(playerId, text);
      }
    };
  }

  /**
   * Initialize all AI sessions
   */
  async initializeGame() {
    console.log('🎮 [GameOrchestrator] Initializing game sessions...');

    try {
      // Initialize President session
      await this.geminiLiveService.initializeSession(
        'moderator',
        'President Dorkesh Cartel',
        presidentPrompt
      );

      // Initialize player sessions
      const playerIds = ['player2', 'player3', 'player4'];
      for (const playerId of playerIds) {
        const prompt = getPlayerPrompt(playerId, false);
        const playerName = this.moderatorController.players[playerId].name;

        await this.geminiLiveService.initializeSession(
          playerId,
          playerName,
          prompt
        );
      }

      console.log('✅ [GameOrchestrator] All sessions initialized');
      return true;
    } catch (error) {
      console.error('❌ [GameOrchestrator] Failed to initialize game:', error);
      throw error;
    }
  }

  /**
   * Start the game - President delivers intro
   */
  async startGame() {
    if (this.isGameStarted) {
      console.warn('⚠️ [GameOrchestrator] Game already started');
      return;
    }

    console.log('🎮 [GameOrchestrator] Starting game!');
    this.isGameStarted = true;

    // Get President's intro script
    const introScript = this.moderatorController.startGame();

    // Send to President's Gemini Live session
    await this.geminiLiveService.sendText(introScript.text, 'moderator');

    console.log('🎙️ [GameOrchestrator] President is speaking...');
  }

  /**
   * Handle phase transitions
   */
  handlePhaseChange(newPhase) {
    switch (newPhase) {
      case GAME_PHASES.SELF_ORGANIZATION:
        console.log('🎮 [GameOrchestrator] President intro complete - waiting for first AI response');
        // Nothing to do - we wait for first AI to speak
        break;

      case GAME_PHASES.FREE_DEBATE:
        console.log('🎮 [GameOrchestrator] Free debate phase started');
        // Secret Moderator has been selected - update their prompt
        this.updateSecretModeratorPrompt();
        break;

      case GAME_PHASES.PRESIDENT_VERDICT:
        console.log('🎮 [GameOrchestrator] President returning for verdict');
        // Handled by callPresidentBack()
        break;
    }
  }

  /**
   * Update Secret Moderator's system prompt with additional instructions
   */
  async updateSecretModeratorPrompt() {
    const secretModId = this.moderatorController.secretModeratorId;

    if (!secretModId) {
      console.error('❌ [GameOrchestrator] No Secret Moderator set!');
      return;
    }

    console.log(`👑 [GameOrchestrator] Updating ${secretModId} with Secret Moderator role`);

    // Get updated prompt with Secret Moderator instructions
    const updatedPrompt = getPlayerPrompt(secretModId, true);

    // Note: We can't dynamically update system prompts in existing sessions
    // Instead, we'll send a context message to the Secret Moderator
    const contextMessage = `
[SYSTEM NOTIFICATION]
You are now the informal facilitator. While still trying to prove you're human:
- Respond to unaddressed comments
- Suggest voting if debate stalls
- Keep things moving naturally
Don't announce this role - just help organically.

Now, respond to acknowledge you understand (briefly).
    `.trim();

    await this.geminiLiveService.sendText(contextMessage, secretModId);
  }

  /**
   * Handle human message input
   */
  async handleHumanMessage(messageText) {
    console.log(`💬 [GameOrchestrator] Human says: "${messageText}"`);

    // Route message through ModeratorController
    const routing = this.moderatorController.routeHumanMessage(messageText);

    if (routing.targetPlayerId === 'broadcast') {
      // Self-organization phase - send to all AIs
      const aiPlayerIds = ['player2', 'player3', 'player4'];
      await this.geminiLiveService.broadcastText(messageText, aiPlayerIds);
    } else {
      // Send to specific AI
      await this.geminiLiveService.sendText(messageText, routing.targetPlayerId);
    }
  }

  /**
   * Call President back for verdict (after consensus)
   */
  async callPresidentBack() {
    console.log('📞 [GameOrchestrator] Calling President back for verdict');

    // Get verdict script from ModeratorController
    const verdictScript = this.moderatorController.callPresidentBack();

    if (!verdictScript) {
      console.error('❌ [GameOrchestrator] Cannot call President - no consensus');
      return;
    }

    // Send to President's session
    await this.geminiLiveService.sendText(verdictScript.text, 'moderator');

    console.log(`🎙️ [GameOrchestrator] President delivering verdict: ${verdictScript.outcome}`);

    // Notify UI of game outcome
    if (this.onGameEnd) {
      this.onGameEnd(verdictScript.outcome);
    }
  }

  /**
   * Get current game state
   */
  getGameState() {
    return {
      ...this.moderatorController.getGameState(),
      isGameStarted: this.isGameStarted
    };
  }

  /**
   * Cleanup - close all sessions
   */
  async cleanup() {
    console.log('🎮 [GameOrchestrator] Cleaning up game sessions');
    await this.geminiLiveService.closeAllSessions();
    this.isGameStarted = false;
  }

  // Callback setters for UI integration
  set onVoteUpdate(callback) { this._onVoteUpdate = callback; }
  get onVoteUpdate() { return this._onVoteUpdate; }

  set onConsensusReached(callback) { this._onConsensusReached = callback; }
  get onConsensusReached() { return this._onConsensusReached; }

  set onAudioPlayback(callback) { this._onAudioPlayback = callback; }
  get onAudioPlayback() { return this._onAudioPlayback; }

  set onTranscriptUpdate(callback) { this._onTranscriptUpdate = callback; }
  get onTranscriptUpdate() { return this._onTranscriptUpdate; }

  set onGameEnd(callback) { this._onGameEnd = callback; }
  get onGameEnd() { return this._onGameEnd; }
}

export default GameOrchestrator;
