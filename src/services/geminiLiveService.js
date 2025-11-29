import { WebSocket } from 'ws';
import { getEnhancedLogger } from '../utils/enhancedLogger.js';

export class GeminiLiveService {
  constructor() {
    this.sessions = new Map(); // playerId -> { history: [], name: "...", apiKey: "..." }
    this.moderatorController = null;
    this.apiLogger = null; // Will be set by server.js
    this.enhancedLogger = getEnhancedLogger();
  }

  /**
   * Initialize a Gemini Chat Session (REST)
   */
  async initializeSession(playerId, name, prompt, apiKey) {
    console.log(`📝 [GeminiService] Initializing REST session for ${name} (${playerId})`);

    if (!apiKey) {
      console.error(`❌ [GeminiService] No API key provided for ${playerId}`);
      return;
    }

    // Store session state
    this.sessions.set(playerId, {
      name,
      apiKey,
      systemPrompt: prompt,
      history: [
        { role: "user", parts: [{ text: prompt }] },
        { role: "model", parts: [{ text: "Understood. I am ready to roleplay." }] }
      ]
    });
  }

  /**
   * Send text to a specific player and get response
   */
  async sendText(text, targetPlayerId, conversationContext = null) {
    const session = this.sessions.get(targetPlayerId);
    if (!session) {
      console.error(`❌ [GeminiService] No session found for ${targetPlayerId}`);
      return;
    }

    console.log(`out [GeminiService] Sending to ${session.name}: "${text.substring(0, 100)}..."`);

    // Build context-aware prompt
    let contextualPrompt = text;

    // ✅ FIX #2b: Check if this is a CRITICAL system instruction (silence callout, etc.)
    const isCriticalInstruction = text.includes('[CRITICAL ALERT]') ||
                                   text.includes('[SYSTEM]:') ||
                                   text.includes('SILENT for') ||
                                   text.includes('didn\'t respond') ||
                                   text.includes('EXTREMELY suspicious');

    // If we have conversation context, provide it for better continuity
    // BUT only for NORMAL turns, not critical instructions
    if (conversationContext && conversationContext.recentMessages && !isCriticalInstruction) {
      const recentConvo = conversationContext.recentMessages
        .map(msg => `${msg.speaker}: "${msg.text}"`)
        .join('\n');

      // Append text to context, don't replace it
      contextualPrompt = `[Recent conversation]\n${recentConvo}\n\n${text}`;
    }

    // Add user message to history
    session.history.push({ role: "user", parts: [{ text: contextualPrompt }] });

    // Log AI context to enhanced logger (what the AI sees)
    const conversationHistory = conversationContext?.recentMessages || [];
    this.enhancedLogger.logAIContext(
      targetPlayerId,
      session.name,
      contextualPrompt,
      conversationHistory,
      session.systemPrompt, // Pass system prompt
      {
        historyLength: session.history.length,
        temperature: 0.9,
        model: 'gemini-2.5-flash-preview-09-2025'
      }
    );

    // Log Gemini request
    if (this.apiLogger) {
      this.apiLogger.log('Gemini', 'request', targetPlayerId, {
        prompt: contextualPrompt.substring(0, 300) + '...',
        historyLength: session.history.length,
        temperature: 0.9,
        maxTokens: 150,
        model: 'gemini-2.5-flash-preview-09-2025'
      });
    }

    try {
      // Call Gemini API
      // Using gemini-2.5-flash-preview for better performance
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${session.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: session.history,
          generationConfig: {
            response_modalities: ["TEXT"], // Explicitly request TEXT only
            temperature: 0.5, // Lowered for stability
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800, // Increased to prevent cut-offs (was 500)
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Validate API response structure
      if (!data.candidates || !data.candidates[0]) {
        console.error(`❌ [GeminiService] Invalid API response for ${targetPlayerId}:`, JSON.stringify(data, null, 2));
        return;
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        console.error(`❌ [GeminiService] Missing content in response for ${targetPlayerId}:`, JSON.stringify(candidate, null, 2));
        return;
      }

      // Log Gemini response
      if (this.apiLogger) {
        this.apiLogger.log('Gemini', 'response', targetPlayerId, {
          responseText: candidate.content.parts[0].text || 'No text',
          finishReason: candidate.finishReason,
          tokensUsed: data.usageMetadata?.totalTokenCount || 'unknown'
        });
      }

      let responseText = candidate.content.parts[0].text;
      console.log(`✅ [GeminiService] Raw response from ${session.name}: "${responseText}"`);

      // NOTE: Pronoun replacement removed - AIs now correctly use "YOU" via prompt instructions
      // The prompts explicitly teach correct pronoun usage with examples

      // ✅ FIX #5: Strip leaked system instructions
      responseText = this.stripLeakedInstructions(responseText);

      if (responseText !== candidate.content.parts[0].text) {
        console.log(`🧹 [GeminiService] Cleaned response from ${session.name}: "${responseText}"`);
      }

      // Add model response to history
      session.history.push({ role: "model", parts: [{ text: responseText }] });

      // Send to Moderator Controller
      if (this.moderatorController) {
        // Note: Audio is empty here, ModeratorController will handle TTS via ElevenLabs
        this.moderatorController.onAIResponse(targetPlayerId, responseText, null);
      }

    } catch (error) {
      console.error(`❌ [GeminiService] Request failed for ${session.name}:`, error);

      // If 429, maybe try a fallback model?
      if (error.message.includes('429')) {
        console.warn('⚠️ [GeminiService] Rate limit hit. Suggest switching models.');
      }
    }
  }

  /**
   * Clear all AI sessions (for game reset)
   */
  clearAllSessions() {
    console.log('🧹 [GeminiService] Clearing all AI sessions');
    this.sessions.clear();
  }

  /**
   * Update a session with additional instructions (e.g., Secret Moderator role)
   */
  addInstructionsToSession(playerId, additionalInstructions) {
    const session = this.sessions.get(playerId);
    if (!session) {
      console.error(`❌ [GeminiService] No session found for ${playerId}`);
      return;
    }

    console.log(`📝 [GeminiService] Adding moderator instructions to ${session.name}`);

    // Add the instructions as a system message in the history
    session.history.push({
      role: "user",
      parts: [{ text: `[SYSTEM UPDATE]: ${additionalInstructions}` }]
    });

    session.history.push({
      role: "model",
      parts: [{ text: "Understood. I will guide the conversation and direct questions at specific people." }]
    });
  }

  /**
   * Send a system notification to all active AIs (e.g., elimination, round change)
   */
  sendSystemNotification(playerIds, notification) {
    console.log(`📢 [GeminiService] System notification to ${playerIds.join(', ')}: ${notification}`);

    for (const playerId of playerIds) {
      const session = this.sessions.get(playerId);
      if (session) {
        // Add as a system message that doesn't require response
        session.history.push({
          role: "user",
          parts: [{ text: `[SYSTEM ANNOUNCEMENT]: ${notification}` }]
        });
        session.history.push({
          role: "model",
          parts: [{ text: "Acknowledged." }]
        });
      }
    }
  }

  /**
   * Broadcast message to multiple players
   */
  async broadcastText(text, playerIds) {
    const promises = playerIds.map(id => this.sendText(text, id));
    await Promise.all(promises);
  }

  /**
   * ✅ FIX #5: Strip leaked system instructions from AI responses
   * Gemini sometimes outputs bracketed meta-instructions that should be hidden
   */
  stripLeakedInstructions(text) {
    if (!text) return text;

    let cleaned = text;

    // Remove [SYSTEM ANNOUNCEMENT]: prefix
    cleaned = cleaned.replace(/\[SYSTEM ANNOUNCEMENT\]:\s*/gi, '');

    // Remove bracketed meta-commentary at end
    // Matches: [Your turn to speak...], [Be aggressive...], [Only X, Y, Z remain], etc.
    cleaned = cleaned.replace(/\s*\[(?:Your turn|Be |Only .* remain|Note:|SYSTEM|CRITICAL).*?\]\s*$/gi, '');

    // Remove any remaining standalone bracketed instructions (on their own line)
    cleaned = cleaned.replace(/^\s*\[(?:Your turn|Be |Only|Note:|SYSTEM|CRITICAL).*?\]\s*$/gim, '');

    // Remove multiple [bracketed] instructions in a row
    cleaned = cleaned.replace(/(\s*\[.*?\]\s*){2,}/g, ' ');

    // Trim extra whitespace
    cleaned = cleaned.trim().replace(/\s+/g, ' ');

    return cleaned;
  }
}

// Singleton instance
let instance = null;

export function initializeGeminiLive() {
  if (!instance) {
    instance = new GeminiLiveService();
  }
  return instance;
}
