
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice mapping for different character types
const voiceMapping: Record<string, string> = {
  'moderator': '9BWtsMINqrJLrRacOk9x', // Aria - clear, neutral (Dorkesh Cartel)
  'Elongated Muskett': 'CwhRBWXzGAHq8TQ4Fs17', // Roger - visionary space entrepreneur
  'Wario Amadeuss': 'TX3LPaxmHKxFdv7VOQHJ', // Liam - AI safety philosopher
  'Domis Hassoiboi': 'JBFqnCBsd6RMkjVDRZzb', // George - philosophical chess master
  'Scan Ctrl+Altman': 'bIHbv24MWmeRgasZH58o', // Will - AGI accelerationist
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice, stability = 0.5 } = await req.json();
    
    if (!text?.trim()) {
      throw new Error('Text is required');
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Get the voice ID from mapping, fallback to default
    const voiceId = voiceMapping[voice] || '9BWtsMINqrJLrRacOk9x'; // Aria as default

    console.log(`TTS Request: "${text.substring(0, 50)}..." with voice: ${voice} (${voiceId})`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: stability,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`TTS Success: Generated ${audioBuffer.byteLength} bytes of audio`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes('Rate limit') ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
