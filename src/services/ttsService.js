// ⚠️ DEPRECATED - MARKED FOR DELETION
// This file is no longer used. ttsProvider.js is the active TTS implementation.
// TODO: Remove this file after confirming no dependencies

// Direct ElevenLabs TTS Service (bypassing Supabase for now)
class TTSService {
  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_75f4a8b908bd5effc7a7207a5153e99d9910ddc1beb4ac45';
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
    // Voice mapping for different character types
    this.voiceMapping = {
      'moderator': '9BWtsMINqrJLrRacOk9x', // Aria - clear, neutral (Dorkesh Cartel)
      'Dorkesh Cartel': '9BWtsMINqrJLrRacOk9x', // Aria - clear, neutral (Dorkesh Cartel)
      'Elongated Muskett': 'CwhRBWXzGAHq8TQ4Fs17', // Roger - visionary space entrepreneur
      'Wario Amadeuss': 'TX3LPaxmHKxFdv7VOQHJ', // Liam - AI safety philosopher
      'Domis Hassoiboi': 'JBFqnCBsd6RMkjVDRZzb', // George - philosophical chess master
      'Scan Ctrl+Altman': 'bIHbv24MWmeRgasZH58o', // Will - AGI accelerationist
    };
  }

  async generateSpeech(text, speaker = 'moderator') {
    if (!text?.trim()) {
      throw new Error('Text is required for TTS');
    }

    const voiceId = this.voiceMapping[speaker] || this.voiceMapping['moderator'];
    console.log(`🎤 TTS Request: "${text.substring(0, 50)}..." with voice: ${speaker} (${voiceId})`);

    try {
      // Note: This will likely hit CORS issues when called from browser
      // In production, this should go through a backend proxy
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
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
      console.log(`✅ TTS Success: Generated ${audioBuffer.byteLength} bytes of audio`);

      // Convert to blob for playback
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      return URL.createObjectURL(audioBlob);

    } catch (error) {
      console.error('❌ Direct TTS Error:', error);
      throw error;
    }
  }

  // Fallback method using Web Speech API (browser TTS)
  async generateSpeechFallback(text, speaker) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to match character voices with available system voices
      const voices = speechSynthesis.getVoices();
      const characterVoice = this.getSystemVoiceForCharacter(speaker, voices);
      
      if (characterVoice) {
        utterance.voice = characterVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onend = () => {
        console.log(`✅ Fallback TTS completed for ${speaker}`);
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Fallback TTS error:', error);
        reject(error);
      };

      console.log(`🎤 Using fallback TTS for ${speaker}: "${text.substring(0, 50)}..."`);
      speechSynthesis.speak(utterance);
    });
  }

  getSystemVoiceForCharacter(speaker, voices) {
    const voicePreferences = {
      'moderator': ['British', 'UK', 'Daniel', 'Alex'],
      'Dorkesh Cartel': ['British', 'UK', 'Daniel', 'Alex'],
      'Elongated Muskett': ['US', 'American', 'David', 'Fred'],
      'Wario Amadeuss': ['British', 'UK', 'Daniel', 'Oliver'],
      'Domis Hassoiboi': ['British', 'UK', 'Daniel', 'Alex'],
      'Scan Ctrl+Altman': ['US', 'American', 'David', 'Aaron'],
    };

    const preferences = voicePreferences[speaker] || ['US', 'American'];
    
    for (const pref of preferences) {
      const voice = voices.find(v => 
        v.name.includes(pref) || 
        v.lang.includes('en-US') || 
        v.lang.includes('en-GB')
      );
      if (voice) return voice;
    }

    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }
}

export default new TTSService();