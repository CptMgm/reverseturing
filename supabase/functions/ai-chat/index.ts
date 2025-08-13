import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, systemPrompt, userPrompt, conversationHistory, maxTokens = 150, temperature = 0.8 } = await req.json();

    console.log(`AI Request - Provider: ${provider}, User: ${userPrompt.substring(0, 50)}...`);

    let response;
    
    switch (provider) {
      case 'openai':
      case 'gpt-4':
        response = await handleOpenAI(systemPrompt, userPrompt, conversationHistory, maxTokens, temperature);
        break;
      case 'claude':
      case 'anthropic':
        response = await handleClaude(systemPrompt, userPrompt, conversationHistory, maxTokens, temperature);
        break;
      case 'gemini':
      case 'google':
        response = await handleGemini(systemPrompt, userPrompt, conversationHistory, maxTokens, temperature);
        break;
      case 'grok':
      case 'xai':
        response = await handleGrok(systemPrompt, userPrompt, conversationHistory, maxTokens, temperature);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Service Error:', error);
    
    // Return fallback response
    const fallbacks = [
      "I think I'm human because I remember things only humans would know.",
      "That's an interesting question. I have memories of childhood that feel very real.",
      "I can feel emotions when I think about my experiences.",
      "My human experiences have shaped who I am today."
    ];
    
    const fallbackResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    return new Response(JSON.stringify({ response: fallbackResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleOpenAI(systemPrompt: string, userPrompt: string, conversationHistory: any[], maxTokens: number, temperature: number) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "I need a moment to think about that.";
}

async function handleClaude(systemPrompt: string, userPrompt: string, conversationHistory: any[], maxTokens: number, temperature: number) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const messages = [
    ...conversationHistory,
    { role: 'user', content: userPrompt }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || "I need a moment to think about that.";
}

async function handleGemini(systemPrompt: string, userPrompt: string, conversationHistory: any[], maxTokens: number, temperature: number) {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  const prompt = `${systemPrompt}\n\nConversation history:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userPrompt}\n\nAssistant:`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "I need a moment to think about that.";
}

async function handleGrok(systemPrompt: string, userPrompt: string, conversationHistory: any[], maxTokens: number, temperature: number) {
  const apiKey = Deno.env.get('XAI_API_KEY');
  if (!apiKey) {
    throw new Error('xAI API key not configured');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt }
  ];

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`xAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "I need a moment to think about that.";
}