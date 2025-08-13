import { supabase } from '@/integrations/supabase/client';

class AIService {
  constructor(provider, playerId = null) {
    this.provider = provider;
    this.playerId = playerId;
  }

  async sendMessage(systemPrompt, userMessage, conversationHistory = []) {
    console.log(`\n🤖 ============ ${this.playerId.toUpperCase()} (${this.provider}) ============`);
    console.log('SYSTEM PROMPT:');
    console.log(systemPrompt);
    console.log('\nUSER MESSAGE:');
    console.log(userMessage);
    console.log('\nCONVERSATION HISTORY:');
    console.log(conversationHistory);
    console.log('========================================');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          provider: this.provider,
          systemPrompt,
          userPrompt: userMessage,
          conversationHistory,
          maxTokens: 150,
          temperature: 0.8,
        },
      });

      if (error) {
        throw new Error(`API request failed: ${error.message}`);
      }

      console.log(`\n✅ RESPONSE FROM ${this.provider.toUpperCase()} (${this.playerId}):`, data.response);
      console.log('============================================\n');
      return data.response;
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse();
    }
  }

  getFallbackResponse() {
    const fallbacks = [
      "I think I'm human because I remember things only humans would know.",
      "That's an interesting question. I have memories of childhood that feel very real.",
      "I can feel emotions when I think about my experiences.",
      "My human experiences have shaped who I am today."
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  async testConnection() {
    try {
      const response = await fetch('/api/test', {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('API connection test:', data);
        return data.providers?.[this.provider] || false;
      }
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export default AIService;