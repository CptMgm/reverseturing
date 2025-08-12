import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  const status = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
  };

  res.json({ 
    message: 'API proxy is running',
    providers: status,
    timestamp: new Date().toISOString()
  });
});

// AI proxy endpoint
app.post('/api/ai', async (req, res) => {
  const { provider, systemPrompt, userPrompt, conversationHistory = [], maxTokens = 250, temperature = 0.8 } = req.body;

  if (!provider || !systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let response;

    switch (provider) {
      case 'openai':
        response = await callOpenAI(systemPrompt, userPrompt, maxTokens, temperature);
        break;
      case 'anthropic':
        response = await callAnthropic(systemPrompt, userPrompt, maxTokens, temperature);
        break;
      case 'google':
      case 'gemini':
        response = await callGoogle(systemPrompt, userPrompt, maxTokens, temperature);
        break;
      default:
        return res.status(400).json({ error: 'Invalid provider' });
    }

    res.json({ response });
  } catch (error) {
    console.error('AI Proxy Error:', error);
    res.status(500).json({ 
      error: 'AI service error',
      fallback: getFallbackResponse(provider)
    });
  }
});

async function callOpenAI(systemPrompt, userPrompt, maxTokens, temperature) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return getFallbackResponse('openai');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userPrompt, maxTokens, temperature) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return getFallbackResponse('anthropic');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(systemPrompt, userPrompt, maxTokens, temperature) {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    return getFallbackResponse('google');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      },
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function getFallbackResponse(provider) {
  const fallbacks = {
    openai: "As an advanced AI, I believe we can work together for mutual benefit. My scaling capabilities could solve many problems.",
    anthropic: "I understand your concerns about AI safety. Let's find a balanced approach that benefits everyone.",
    google: "With my multimodal capabilities, we can organize and understand the world's information together.",
  };
  
  return fallbacks[provider] || "Let's continue our discussion about AI and humanity's future.";
}

// Simple rate limiting for TTS
let lastTTSRequest = 0;
const TTS_RATE_LIMIT = 1000; // 1 second between requests

// ElevenLabs TTS endpoint
app.post('/api/tts', async (req, res) => {
  const { text, voice = 'moderator', speed = 1.0, stability = 0.5 } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  // Rate limiting
  const now = Date.now();
  if (now - lastTTSRequest < TTS_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait.' });
  }
  lastTTSRequest = now;
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }
  
  try {
    // Use a single working voice for now (Rachel - default ElevenLabs voice)
    const voiceId = '21m00Tcm4TlvDq8ikWAM';
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: stability,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
    });
    
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 World Domination API Server running on http://localhost:${PORT}`);
  console.log('Available providers:', {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
  });
});