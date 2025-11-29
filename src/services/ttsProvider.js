import dotenv from 'dotenv';

dotenv.config();

/**
 * TTS Provider Module
 * Supports both ElevenLabs (primary) and Gemini native TTS (backup/testing)
 *
 * Environment Variables:
 * - TTS_PROVIDER: 'elevenlabs' (default) or 'google'
 * - ELEVENLABS_API_KEY: Required for ElevenLabs
 * - GOOGLE_API_KEY_F3 or GOOGLE_API_KEY: Required for Gemini TTS (same keys used for text generation)
 */

// Voice mapping for ElevenLabs (using new custom voices)
const ELEVENLABS_VOICES = {
  'moderator': 's0XGIcqmceN2l7kjsqoZ',  // President Dorkesh (Voice Library)
  'player2': 'QI6dMUTCXXVqw27WrlQs',    // Wario Amadeuss (Dario)
  'player3': 'sLfduly0sixkh8riDzed',    // Domis Has-a-bus
  'player4': '7EzWGsX10sAS4c9m9cPf',    // Scan Ctrl+Altman
};

// Voice mapping for Google Gemini-TTS
// Available voices: https://cloud.google.com/text-to-speech/docs/voices
const GOOGLE_VOICES = {
  'moderator': 'Charon',      // Male, authoritative (President)
  'player2': 'Sadachbia',     // Male, dramatic (Wario)
  'player3': 'Schedar',       // Male, intellectual (Domis)
  'player4': 'Puck',          // Male, casual (Scan)
};

// Get the configured TTS provider (default to ElevenLabs)
const TTS_PROVIDER = process.env.TTS_PROVIDER?.toLowerCase() || 'elevenlabs';

/**
 * Get voice settings for each character
 * Each character has unique voice parameters for better personality expression
 */
function getVoiceSettings(playerId) {
  switch (playerId) {
    case 'moderator':
      return {
        stability: 0.70,
        similarity_boost: 0.85,
        style: 0.15,
        speed: 0.93,
        use_speaker_boost: true
      };

    case 'player2': // Wario
      return {
        stability: 0.35,
        similarity_boost: 0.70,
        style: 0.60,
        speed: 1.00,
        use_speaker_boost: true
      };

    case 'player3': // Domis
      return {
        stability: 0.45,
        similarity_boost: 0.80,
        style: 0.35,
        speed: 0.94,
        use_speaker_boost: true
      };

    case 'player4': // Scan
      return {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.10,
        speed: 0.92,
        use_speaker_boost: true
      };

    default:
      return {
        stability: 0.50,
        similarity_boost: 0.75,
        style: 0.00,
        speed: 1.0,
        use_speaker_boost: true
      };
  }
}

/**
 * Generate TTS using ElevenLabs
 * Returns a readable stream of audio chunks
 */
async function generateTTSElevenLabs(text, playerId, apiLogger) {
  const apiKey = process.env.ELEVENLABS_API_KEY_2 || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('❌ [ElevenLabs] Missing ELEVENLABS_API_KEY_2 or ELEVENLABS_API_KEY');
    return null;
  }

  const voiceId = ELEVENLABS_VOICES[playerId] || ELEVENLABS_VOICES['moderator'];

  // Log TTS request
  if (apiLogger) {
    apiLogger.log('ElevenLabs', 'request', playerId, {
      text: text,
      textLength: text.length,
      voiceId: voiceId,
      model: "eleven_monolingual_v1",
      type: "stream"
    });
  }

  try {
    console.log(`🎤 [ElevenLabs] Generating TTS for ${playerId} (${text.length} chars)`);

    // Use the /stream endpoint with latency optimization
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: getVoiceSettings(playerId)
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (apiLogger) {
        apiLogger.log('ElevenLabs', 'error', playerId, {
          status: response.status,
          error: errorText
        });
      }
      console.error(`❌ [ElevenLabs] API error: ${response.status} - ${errorText}`);
      return null;
    }

    console.log(`✅ [ElevenLabs] Stream started for ${playerId}`);

    // Convert Web Stream to Node Stream for compatibility with pipe()
    const { Readable } = await import('stream');
    const stream = Readable.fromWeb(response.body);

    return { stream, contentType: 'audio/mpeg' };

  } catch (error) {
    console.error(`❌ [ElevenLabs] Error:`, error);
    if (apiLogger) {
      apiLogger.log('ElevenLabs', 'error', playerId, {
        error: error.message
      });
    }
    return null;
  }
}

/**
 * Generate TTS using Gemini native TTS (gemini-2.5-flash-preview-tts)
 * Uses the same API as Gemini text generation, but with audio output
 * Returns a readable stream of audio chunks
 */
async function generateTTSGoogle(text, playerId, apiLogger) {
  const apiKey = process.env.GOOGLE_API_KEY_F3 || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ [Gemini TTS] No Google API key found');
    return null;
  }

  const voiceName = GOOGLE_VOICES[playerId] || GOOGLE_VOICES['moderator'];

  // Log TTS request
  if (apiLogger) {
    apiLogger.log('Gemini-TTS', 'request', playerId, {
      text: text,
      textLength: text.length,
      voice: voiceName,
      model: "gemini-2.5-flash-preview-tts",
      type: "native"
    });
  }

  try {
    const startTime = Date.now();
    console.log(`🎤 [Gemini TTS] Generating TTS for ${playerId} (${text.length} chars) at ${new Date().toISOString()}`);

    // Use Gemini API with audio response modality
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: `Read this out loud: ${text}`
          }]
        }],
        generationConfig: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: voiceName
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Gemini TTS] API error: ${response.status} - ${errorText}`);
      if (apiLogger) {
        apiLogger.log('Gemini-TTS', 'error', playerId, {
          status: response.status,
          error: errorText
        });
      }
      return null;
    }

    const data = await response.json();

    // Enhanced Logging for Debugging
    console.log(`🔍 [Gemini TTS] Response Candidates: ${data.candidates?.length}`);
    if (data.candidates?.[0]) {
      const firstCand = data.candidates[0];
      console.log(`🔍 [Gemini TTS] Candidate 0 Finish Reason: ${firstCand.finishReason}`);
      console.log(`🔍 [Gemini TTS] Candidate 0 Content Parts: ${firstCand.content?.parts?.length}`);
      if (firstCand.content?.parts?.[0]) {
        const part = firstCand.content.parts[0];
        const hasInlineData = !!part.inline_data;
        const hasInlineDataCamel = !!part.inlineData;
        console.log(`🔍 [Gemini TTS] Part 0 has inline_data: ${hasInlineData}, inlineData: ${hasInlineDataCamel}`);
      }
    }

    // Extract audio data from response
    // Response format: candidates[0].content.parts[0].inline_data.data (or inlineData)
    const part = data.candidates?.[0]?.content?.parts?.[0];
    const inlineData = part?.inline_data || part?.inlineData;

    if (!inlineData?.data) {
      console.error(`❌ [Gemini TTS] Invalid response structure:`, JSON.stringify(data, null, 2));
      return null;
    }

    const base64Audio = inlineData.data;

    // Check for "silence" or garbage (all A's = null bytes)
    if (base64Audio.startsWith('AAAAAAAAAAAAAAAAAAAA')) {
      console.warn('⚠️ [Gemini TTS] Received silence/empty audio (all null bytes). Treating as failure.');
      return null;
    }

    // Decode base64 audio
    // Safely handle snake_case vs camelCase response from Gemini
    const inlineDataObj = part.inline_data || part.inlineData;
    if (!inlineDataObj || !inlineDataObj.data) {
      console.error('❌ [Gemini TTS] No inline data found in response part');
      return null;
    }

    const pcmData = Buffer.from(inlineDataObj.data, 'base64');

    // Create WAV header (24kHz, 1 channel, 16-bit)
    // Gemini outputs 24kHz mono PCM by default
    const wavHeader = createWavHeader(24000, 1, 16, pcmData.length);
    const wavData = Buffer.concat([wavHeader, pcmData]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [Gemini TTS] Generated ${wavData.length} bytes (WAV wrapped) for ${playerId} in ${duration}s`);

    // Log success
    if (apiLogger) {
      apiLogger.log('Gemini-TTS', 'response', playerId, {
        audioSize: wavData.length,
        format: 'audio/wav'
      });
    }

    const { Readable } = await import('stream');
    const stream = Readable.from(wavData);

    return { stream, contentType: 'audio/wav' };

  } catch (error) {
    console.error(`❌ [Gemini TTS] Error:`, error);
    if (apiLogger) {
      apiLogger.log('Gemini-TTS', 'error', playerId, {
        error: error.message
      });
    }
    return null;
  }
}

/**
 * Main TTS generation function
 * Automatically selects provider based on TTS_PROVIDER env variable
 * Falls back to alternate provider if primary fails
 *
 * @param {string} text - Text to synthesize
 * @param {string} playerId - Player ID ('moderator', 'player2', 'player3', 'player4')
 * @param {object} apiLogger - Optional logger for tracking API calls
 * @returns {ReadableStream|null} - Stream of audio chunks or null if failed
 */
export async function generateTTS(text, playerId = 'moderator', apiLogger = null) {
  if (!text || text.trim().length === 0) {
    console.warn('⚠️ [TTS] Empty text provided');
    return null;
  }

  console.log(`🗣️ [TTS] Using provider: ${TTS_PROVIDER}`);

  // Try primary provider
  if (TTS_PROVIDER === 'google') {
    const result = await generateTTSGoogle(text, playerId, apiLogger);
    if (result) return result;

    console.warn('⚠️ [TTS] Gemini TTS failed, falling back to ElevenLabs...');
    // Fallback to ElevenLabs
    return generateTTSElevenLabs(text, playerId, apiLogger);
  } else {
    const result = await generateTTSElevenLabs(text, playerId, apiLogger);
    if (result) return result;

    console.warn('⚠️ [TTS] ElevenLabs failed, falling back to Google...');
    // Fallback to Google
    return generateTTSGoogle(text, playerId, apiLogger);
  }
}

/**
 * Get information about the current TTS configuration
 */
export function getTTSInfo() {
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_API_KEY_F3 || !!process.env.GOOGLE_API_KEY;

  return {
    provider: TTS_PROVIDER,
    hasElevenLabs,
    hasGoogle,
    elevenLabsVoices: ELEVENLABS_VOICES,
    googleVoices: GOOGLE_VOICES
  };
}

// Helper to create WAV header for raw PCM data
function createWavHeader(sampleRate, numChannels, bitsPerSample, dataLength) {
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

export default { generateTTS, getTTSInfo };
