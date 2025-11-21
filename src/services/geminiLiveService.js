import { WebSocket } from 'ws';

export class GeminiLiveService {
  constructor() {
    this.sessions = new Map(); // playerId -> { history: [], name: "...", apiKey: "..." }
    this.moderatorController = null;
    this.apiLogger = null; // Will be set by server.js
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

    console.log(`out [GeminiService] Sending to ${session.name}: "${text}"`);

    // Build context-aware prompt
    let contextualPrompt = text;

    // If we have conversation context, provide it for better continuity
    if (conversationContext && conversationContext.recentMessages) {
      const recentConvo = conversationContext.recentMessages
        .map(msg => `${msg.speaker}: "${msg.text}"`)
        .join('\n');

      contextualPrompt = `[Recent conversation]\n${recentConvo}\n\n[Your turn to respond naturally to continue this conversation. Keep it under 30 words. Be emotional and imperfect.]`;
    }

    // Add user message to history
    session.history.push({ role: "user", parts: [{ text: contextualPrompt }] });

    // Log Gemini request
    if (this.apiLogger) {
      this.apiLogger.log('Gemini', 'request', targetPlayerId, {
        prompt: contextualPrompt.substring(0, 300) + '...',
        historyLength: session.history.length,
        temperature: 0.9,
        maxTokens: 150,
        model: 'gemini-2.0-flash'
      });
    }

    try {
      // Call Gemini API
      // Using gemini-2.0-flash as it is confirmed available and stable
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${session.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: session.history,
          generationConfig: {
            response_modalities: ["TEXT"], // Explicitly request TEXT only
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150, // Keep responses concise
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Log Gemini response
      if (this.apiLogger && data.candidates && data.candidates[0]) {
        this.apiLogger.log('Gemini', 'response', targetPlayerId, {
          responseText: data.candidates[0].content?.parts[0]?.text || 'No text',
          finishReason: data.candidates[0].finishReason,
          tokensUsed: data.usageMetadata?.totalTokenCount || 'unknown'
        });
      }

      if (data.candidates && data.candidates[0].content) {
        let responseText = data.candidates[0].content.parts[0].text;
        console.log(`✅ [GeminiService] Response from ${session.name}: "${responseText}"`);

        // CRITICAL FIX: Replace any standalone "You" with the actual player name
        // This prevents AIs from saying "Right, You?" when they should say "Right, Chris?"
        if (this.moderatorController && this.moderatorController.players.player1) {
          const humanName = this.moderatorController.players.player1.name;
          // Replace "You?" or "You," or "You " or "YOU" with the actual name (case insensitive)
          // But NOT "your" or "you're" - only standalone "you"
          responseText = responseText.replace(/\b(You|YOU)([?,!\s])/g, `${humanName}$2`);
          responseText = responseText.replace(/\b(You|YOU)\./g, `${humanName}.`);
          // Also replace when it's at the end of a sentence
          responseText = responseText.replace(/,\s+(You|YOU)([?,!\s]|$)/g, `, ${humanName}$2`);
          console.log(`🔧 [GeminiService] After You→${humanName} replacement: "${responseText}"`);
        }

        // Add model response to history
        session.history.push({ role: "model", parts: [{ text: responseText }] });

        // Send to Moderator Controller
        if (this.moderatorController) {
          // Note: Audio is empty here, ModeratorController will handle TTS via ElevenLabs
          this.moderatorController.onAIResponse(targetPlayerId, responseText, null);
        }
      } else {
        console.warn(`⚠️ [GeminiService] No content in response for ${targetPlayerId}`);
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
   * Broadcast message to multiple players
   */
  async broadcastText(text, playerIds) {
    const promises = playerIds.map(id => this.sendText(text, id));
    await Promise.all(promises);
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
