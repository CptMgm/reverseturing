import { supabase } from '../integrations/supabase/client';

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
    
    // TEMPORARILY DISABLE SUPABASE CALLS FOR DEBUGGING
    console.warn('🚨 Using fallback responses for debugging (Supabase Edge Functions disabled)');
    const response = this.getFallbackResponse();
    console.log(`\n✅ FALLBACK RESPONSE FROM ${this.provider.toUpperCase()} (${this.playerId}):`, response);
    console.log('============================================\n');
    return response;
    
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
    console.log('🚨 Using fallback response due to API failure');
    
    // Character-specific fallback responses
    const characterResponses = {
      'player1': [ // Elongated Muskett
        "I remember staring at the stars as a child, dreaming of Mars colonies. That sense of infinite possibility - that's what makes me human.",
        "When I first held my daughter, I felt this overwhelming responsibility for humanity's future. Pure, unfiltered human emotion.",
        "The moment I realized we could actually make life multiplanetary - that mixture of terror and excitement - that's uniquely human."
      ],
      'player2': [ // Wario Amadeuss
        "During my PhD research, I experienced profound worry about AI alignment. The weight of existential responsibility felt deeply human.",
        "I remember late nights reading about AI safety, feeling genuine fear for humanity's future. That moral weight is purely human.",
        "When discussing constitutional AI with colleagues, I felt hope mixed with dread - emotions only humans understand."
      ],
      'player3': [ // Domis Hassoiboi
        "Playing chess as a child, I felt the beautiful frustration of being outmatched. That competitive spirit defines humanity.",
        "I remember my first chess tournament loss - the sting of defeat mixed with respect for my opponent. Pure human experience.",
        "Teaching my son chess and watching his eyes light up at his first victory - that generational joy is uniquely human."
      ],
      'player4': [ // Scan Ctrl+Altman
        "The day we launched GPT-3, I felt this mixture of pride and terror about what we'd unleashed. Deeply human contradictions.",
        "I remember coding late into the night, driven by this inexplicable human need to push boundaries and create.",
        "When I first saw AGI potential, I experienced this uniquely human cocktail of excitement and existential dread."
      ]
    };
    
    const responses = characterResponses[this.playerId] || [
      "I think I'm human because I remember things only humans would know.",
      "That's an interesting question. I have memories of childhood that feel very real.",
      "I can feel emotions when I think about my experiences.",
      "My human experiences have shaped who I am today."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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