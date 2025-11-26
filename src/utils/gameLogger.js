/**
 * Game Logger - Provides consistent, timestamped logging for the game session
 * Follows the ideal server log format with T+X.XXXs timestamps
 */

class GameLogger {
  constructor() {
    this.sessionStartTime = null;
    this.enabled = true;
  }

  /**
   * Start a new logging session
   */
  startSession() {
    this.sessionStartTime = Date.now();
    const timestamp = new Date().toISOString();
    console.log('============================================================');
    console.log(`GAME SESSION START - ${timestamp}`);
    console.log('============================================================');
  }

  /**
   * Get relative timestamp in T+X.XXXs format
   */
  getTimestamp() {
    if (!this.sessionStartTime) {
      this.startSession();
    }
    const elapsed = (Date.now() - this.sessionStartTime) / 1000;
    return `T+${elapsed.toFixed(3)}s`;
  }

  /**
   * Log a system event
   */
  system(message, data = null) {
    const ts = this.getTimestamp();
    const msg = `${ts} [SYSTEM] ${message}`;
    console.log(msg);
    if (data) {
      console.log(`${ts}         Data:`, JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log a phase transition
   */
  phase(from, to) {
    const ts = this.getTimestamp();
    console.log(`${ts} [SYSTEM] Phase transition: ${from} → ${to}`);
  }

  /**
   * Log AI-related events
   */
  ai(playerId, message, data = null) {
    const ts = this.getTimestamp();
    console.log(`${ts} [AI] ${message}`, data ? data : '');
  }

  /**
   * Log Gemini API calls
   */
  gemini(playerId, message, latency = null) {
    const ts = this.getTimestamp();
    const latencyStr = latency ? ` (${(latency / 1000).toFixed(2)}s latency)` : '';
    console.log(`${ts} [GEMINI→${playerId}] ${message}${latencyStr}`);
  }

  /**
   * Log TTS events
   */
  tts(message, latency = null) {
    const ts = this.getTimestamp();
    const latencyStr = latency ? ` (${(latency / 1000).toFixed(1)}s latency)` : '';
    console.log(`${ts} [TTS] ${message}${latencyStr}`);
  }

  /**
   * Log queue events
   */
  queue(message, queueState = null) {
    const ts = this.getTimestamp();
    console.log(`${ts} [QUEUE] ${message}`);
    if (queueState) {
      console.log(`${ts}        Queue state:`, queueState);
    }
  }

  /**
   * Log turn management events
   */
  turn(message, context = null) {
    const ts = this.getTimestamp();
    console.log(`${ts} [TURN] ${message}`);
    if (context) {
      console.log(`${ts}       Context:`, context);
    }
  }

  /**
   * Log voting events
   */
  vote(message, data = null) {
    const ts = this.getTimestamp();
    console.log(`${ts} [VOTE] ${message}`);
    if (data) {
      console.log(`${ts}       Data:`, data);
    }
  }

  /**
   * Log player events
   */
  player(playerId, action, details = null) {
    const ts = this.getTimestamp();
    console.log(`${ts} [PLAYER] ${playerId} ${action}`);
    if (details) {
      console.log(`${ts}         Details:`, details);
    }
  }

  /**
   * Log audio events
   */
  audio(playerId, message, duration = null) {
    const ts = this.getTimestamp();
    const durationStr = duration ? ` (${duration.toFixed(1)}s)` : '';
    console.log(`${ts} [AUDIO] ${playerId}: ${message}${durationStr}`);
  }

  /**
   * Log WebSocket events
   */
  ws(direction, type, data = null) {
    const ts = this.getTimestamp();
    const arrow = direction === 'send' ? '→CLIENT' : '→SERVER';
    console.log(`${ts} [WS${arrow}] ${type}`);
    if (data && this.enabled) {
      // Only log data in verbose mode
      // console.log(`${ts}         Data:`, data);
    }
  }

  /**
   * Log conversation messages
   */
  conversation(playerId, speaker, text) {
    const ts = this.getTimestamp();
    // Log full message so we can see interruptions
    console.log(`${ts} [CONVERSATION] ${speaker} (${playerId}): "${text}"`);
  }

  /**
   * Log client events
   */
  client(message) {
    const ts = this.getTimestamp();
    console.log(`${ts} [CLIENT] ${message}`);
  }

  /**
   * Log moderator (President) events
   */
  moderator(message) {
    const ts = this.getTimestamp();
    console.log(`${ts} [MODERATOR] ${message}`);
  }

  /**
   * Log errors
   */
  error(context, message, error = null) {
    const ts = this.getTimestamp();
    console.error(`${ts} [ERROR] ${context}: ${message}`);
    if (error) {
      console.error(`${ts}        Error:`, error);
    }
  }

  /**
   * Log warnings
   */
  warn(message) {
    const ts = this.getTimestamp();
    console.warn(`${ts} [WARNING] ${message}`);
  }

  /**
   * Log a separator for major events
   */
  separator(title = '') {
    const ts = this.getTimestamp();
    console.log('');
    console.log('============================================================');
    if (title) {
      console.log(`${ts} ${title}`);
      console.log('============================================================');
    }
  }
}

// Export singleton instance
export const gameLogger = new GameLogger();
