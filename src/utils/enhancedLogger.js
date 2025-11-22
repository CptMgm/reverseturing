import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Enhanced Logger for Reverse Turing Test
 * Logs timing, queue decisions, per-AI context, and full conversation flow
 */
export class EnhancedLogger {
  constructor() {
    this.sessionTimestamp = null;
    this.logDir = null;
    this.aiLogsDir = null;
    this.timingLogPath = null;
    this.queueLogPath = null;
    this.conversationLogPath = null;
    this.lastMessageTime = null;
  }

  initializeSession() {
    const now = new Date();
    this.sessionTimestamp = now.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\..+/, '');

    // Create main logs directory
    if (!existsSync('logs')) {
      mkdirSync('logs');
    }

    // Create session-specific directory
    this.logDir = join('logs', `session_${this.sessionTimestamp}`);
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir);
    }

    // Create AI-specific logs subdirectory
    this.aiLogsDir = join(this.logDir, 'ai_contexts');
    if (!existsSync(this.aiLogsDir)) {
      mkdirSync(this.aiLogsDir);
    }

    // Initialize log files
    this.timingLogPath = join(this.logDir, 'timing.txt');
    this.queueLogPath = join(this.logDir, 'queue_decisions.txt');
    this.conversationLogPath = join(this.logDir, 'conversation_full.txt');

    console.log(`📝 [EnhancedLogger] Session initialized: ${this.sessionTimestamp}`);
    console.log(`📁 [EnhancedLogger] Logs directory: ${this.logDir}`);

    // Write headers
    this.writeFile(this.timingLogPath, '=== TIMING LOG ===\n');
    this.writeFile(this.queueLogPath, '=== QUEUE DECISIONS LOG ===\n');
    this.writeFile(this.conversationLogPath, '=== FULL CONVERSATION LOG ===\n\n');
  }

  /**
   * Log a message in the conversation
   */
  logMessage(playerId, speaker, text, messageType = 'speech') {
    if (!this.conversationLogPath) this.initializeSession();

    const now = Date.now();
    const timestamp = new Date(now).toISOString();

    // Calculate silence gap
    let silenceGap = 0;
    if (this.lastMessageTime) {
      silenceGap = now - this.lastMessageTime;
    }

    // Format message type indicator
    const typeIndicator = {
      'speech': '🗣️',
      'text': '💬',
      'system': '⚙️',
      'elimination': '💀'
    }[messageType] || '📝';

    // Log to conversation file
    const logEntry = `[${timestamp}] ${typeIndicator} ${speaker} (${playerId}): ${text}\n`;
    this.writeFile(this.conversationLogPath, logEntry);

    // Log silence gap if significant
    if (silenceGap > 0) {
      const silenceSeconds = (silenceGap / 1000).toFixed(2);
      if (silenceGap > 1000) { // Only log gaps > 1 second
        const silenceLog = `    ⏱️  [SILENCE: ${silenceSeconds}s]\n`;
        this.writeFile(this.conversationLogPath, silenceLog);
        this.logTiming('silence_gap', silenceSeconds, { between: `${this.lastSpeaker} → ${speaker}` });
      }
    }

    this.lastMessageTime = now;
    this.lastSpeaker = speaker;
  }

  /**
   * Log timing data
   */
  logTiming(event, durationSeconds, metadata = {}) {
    if (!this.timingLogPath) this.initializeSession();

    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(metadata).length > 0 ? ` | ${JSON.stringify(metadata)}` : '';
    const logEntry = `[${timestamp}] ${event}: ${durationSeconds}s${metaStr}\n`;

    this.writeFile(this.timingLogPath, logEntry);
  }

  /**
   * Log queue decision (added, dismissed, played)
   */
  logQueueDecision(action, playerId, reason, metadata = {}) {
    if (!this.queueLogPath) this.initializeSession();

    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(metadata).length > 0 ? ` | ${JSON.stringify(metadata)}` : '';
    const logEntry = `[${timestamp}] ${action.toUpperCase()}: ${playerId} - ${reason}${metaStr}\n`;

    this.writeFile(this.queueLogPath, logEntry);
  }

  /**
   * Log AI context (what the AI sees when prompted)
   */
  /**
   * Log AI context (what the AI sees when prompted)
   */
  logAIContext(playerId, aiName, prompt, conversationHistory, systemPrompt, metadata = {}) {
    if (!this.aiLogsDir) this.initializeSession();

    const timestamp = new Date().toISOString();
    const aiLogPath = join(this.aiLogsDir, `${playerId}_${aiName.replace(/\s+/g, '_')}.txt`);

    const separator = '\n' + '='.repeat(80) + '\n';
    const header = `[${timestamp}] AI PROMPT\n`;

    const systemSection = systemPrompt ? `\nSYSTEM PROMPT:\n${systemPrompt}\n` : '';

    const historySection = '\nCONVERSATION HISTORY:\n' +
      conversationHistory.map((msg, i) => `  ${i + 1}. ${msg.speaker}: "${msg.text}"`).join('\n');

    const promptSection = '\n\nPROMPT SENT:\n' + prompt;
    const metaSection = Object.keys(metadata).length > 0 ? '\n\nMETADATA:\n' + JSON.stringify(metadata, null, 2) : '';

    const fullEntry = separator + header + systemSection + historySection + promptSection + metaSection + separator;

    this.writeFile(aiLogPath, fullEntry);
  }

  /**
   * Log speech duration
   */
  logSpeechDuration(playerId, speaker, durationSeconds) {
    this.logTiming('speech_duration', durationSeconds, { speaker, playerId });

    // Also add to conversation log
    const speechLog = `    🔊 [SPEECH DURATION: ${durationSeconds}s]\n`;
    this.writeFile(this.conversationLogPath, speechLog);
  }

  /**
   * Helper to write to file
   */
  writeFile(filePath, content) {
    try {
      appendFileSync(filePath, content);
    } catch (error) {
      console.error(`❌ [EnhancedLogger] Failed to write to ${filePath}:`, error);
    }
  }

  /**
   * Get current session directory
   */
  getSessionDir() {
    return this.logDir;
  }
}

// Singleton instance
let instance = null;

export function getEnhancedLogger() {
  if (!instance) {
    instance = new EnhancedLogger();
  }
  return instance;
}
