class AudioService {
  constructor() {
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentAudio = null;
    this.currentResolve = null; // Store the resolve function for skipping
    this.speechRecognition = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.isListening = false;

    this.setupSpeechRecognition();
  }

  // Text-to-Speech using ElevenLabs via server.js backend
  async speak(text, speaker = 'moderator') {
    console.log(`🎙️ speak() called for ${speaker}: "${text.substring(0, 50)}..."`);

    if (this.isMuted || !text?.trim()) {
      console.log('⏭️ TTS skipped:', this.isMuted ? 'muted' : 'empty text');
      return Promise.resolve();
    }

    console.log('📡 Making TTS request to /api/tts...');

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: speaker,
          stability: 0.5,
        }),
      });

      console.log('📡 TTS response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS request failed:', response.status, errorText);

        if (response.status === 429) {
          console.warn('⏳ TTS rate limited, retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.speak(text, speaker); // Retry once
        }

        console.warn('🚨 TTS unavailable, using fallback...');
        return this.speakFallback(text, speaker);
      }

      // Server returns audio/mpeg data directly
      const audioBlob = await response.blob();
      console.log('✅ TTS blob received, size:', audioBlob.size);
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('✅ Audio URL created, calling playAudio()...');

      // Play through Daily if available, otherwise play locally
      if (speaker !== 'moderator' && speaker !== 'human') {
        const { default: dailyService } = await import('./dailyService.js');
        if (dailyService.isJoined) {
          console.log(`📞 Playing audio for ${speaker} in Daily room`);
          // Daily already plays locally, so we just need to return its promise
          return dailyService.playAudioForBot(audioBlob, speaker);
        }
      }

      // Fallback to local playback if Daily not available
      return this.playAudio(audioUrl);
    } catch (error) {
      console.error('❌ TTS Error:', error);
      console.warn('🚨 Using fallback TTS due to error');
      return this.speakFallback(text, speaker); // Use fallback instead of failing silently
    }
  }

  // Fallback TTS using Web Speech API
  async speakFallback(text, speaker) {
    if (this.isMuted || !text?.trim()) {
      console.log('Fallback TTS skipped:', this.isMuted ? 'muted' : 'empty text');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported, skipping fallback TTS');
        resolve();
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
      utterance.volume = this.volume;

      utterance.onend = () => {
        console.log(`✅ Fallback TTS completed for ${speaker}`);
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Fallback TTS error:', error);
        resolve(); // Don't reject, just continue
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

  async playAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      console.log('🔊 playAudio called with URL:', audioUrl.substring(0, 50));

      const audio = new Audio(audioUrl);
      audio.volume = this.volume;

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          this.currentResolve = null;
          resolve();
        }
      };

      // Store resolve function so we can call it when skipping
      this.currentResolve = safeResolve;

      audio.onended = () => {
        console.log('✅ Audio ended');
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        safeResolve();
      };

      audio.onerror = (e) => {
        console.error('❌ Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        console.warn('⚠️ Audio failed, continuing without sound');
        safeResolve();
      };

      audio.oncanplay = () => {
        console.log('✅ Audio ready to play');
      };

      this.currentAudio = audio;
      console.log('▶️ Starting audio playback, volume:', this.volume);

      // Try to play, but don't block game flow if it fails
      audio.play().then(() => {
        console.log('✅ Audio play() started successfully');
      }).catch((e) => {
        console.warn('⚠️ Audio play() failed (likely needs user interaction):', e.message);
        // Immediately resolve if play fails
        safeResolve();
      });

      // Safety timeout - resolve after 30 seconds no matter what
      setTimeout(() => {
        if (!resolved) {
          console.warn('⚠️ Audio playback timeout after 30s, continuing game');
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          safeResolve();
        }
      }, 30000);
    });
  }

  // Queue system for managing multiple speakers
  async queueSpeech(text, speaker) {
    console.log(`📢 queueSpeech() called for ${speaker}, isPlaying: ${this.isPlaying}, queue length: ${this.audioQueue.length}`);

    return new Promise((resolve) => {
      const speechPromise = async () => {
        console.log(`🎬 Starting speech for ${speaker}`);
        try {
          await this.speak(text, speaker);
          console.log(`✅ Speech completed for ${speaker}`);
        } catch (error) {
          console.error(`❌ Speech error for ${speaker}:`, error);
        }
        resolve(); // Resolve when this specific speech is done
      };

      if (!this.isPlaying) {
        console.log(`▶️ No speech playing, starting immediately for ${speaker}`);
        this.isPlaying = true;
        speechPromise().finally(() => {
          console.log(`🏁 Speech promise finished for ${speaker}`);
          this.isPlaying = false;
          this.processQueue();
        });
      } else {
        console.log(`⏸️ Speech in progress, queuing ${speaker}`);
        this.audioQueue.push(() => speechPromise().finally(() => resolve()));
      }
    });
  }

  async processQueue() {
    if (this.audioQueue.length > 0 && !this.isPlaying) {
      this.isPlaying = true;
      const nextSpeech = this.audioQueue.shift();
      try {
        await nextSpeech();
      } finally {
        this.isPlaying = false;
        this.processQueue();
      }
    }
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  skipCurrentAudio() {
    console.log('⏭️ Skipping current audio');

    // Stop the audio immediately
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // If using speech synthesis, cancel it
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    // Immediately resolve the promise to unblock game flow
    if (this.currentResolve) {
      console.log('✅ Resolving audio promise immediately');
      this.currentResolve();
      this.currentResolve = null;
    }

    // Mark as not playing so next audio can start
    this.isPlaying = false;

    // Process any queued audio
    this.processQueue();
  }

  // Speech Recognition setup
  setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognition();
    
    this.speechRecognition.continuous = false;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'en-US';
    this.speechRecognition.maxAlternatives = 1;

    this.speechRecognition.onstart = () => {
      this.isListening = true;
    };

    this.speechRecognition.onend = () => {
      this.isListening = false;
    };
  }

  async startListening() {
    if (!this.speechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      try {
        this.speechRecognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  stopListening() {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
    }
  }

  // Audio controls
  setMuted(muted) {
    console.log('Setting muted:', muted);
    this.isMuted = muted;
    if (muted) {
      this.stopCurrentAudio();
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  get speechRecognitionAvailable() {
    return !!this.speechRecognition;
  }

  get isCurrentlyPlaying() {
    return this.isPlaying;
  }

  get isCurrentlyListening() {
    return this.isListening;
  }

  // Initialize audio context with user interaction
  async initializeAudio() {
    console.log('🔊 initializeAudio() called');
    try {
      // Create a silent audio to unlock audio context
      const silentAudio = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAAHR0cDovL3d3dy5iaWdzb3VuZGJhbmsuY29tL0FEVEQAAAA+AAAGYXJ0aXN0AFNpbGVuY2UgLSBCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwD/80DEAAAAHA3Og==');
      silentAudio.volume = 0.01;

      console.log('🔊 Attempting to play silent audio...');
      // Don't await - just try to play and ignore if it fails
      silentAudio.play()
        .then(() => {
          console.log('✅ Audio context initialized successfully');
        })
        .catch((error) => {
          console.warn('⚠️ Silent audio play failed (autoplay blocked):', error.message);
          // This is fine - audio will work once user interacts
        });

      // Always return true immediately - don't wait for play() to resolve
      console.log('✅ Audio initialization completed (may need user interaction for autoplay)');
      return true;
    } catch (error) {
      console.warn('⚠️ Could not initialize audio context:', error);
      return false;
    }
  }
}

export default new AudioService();
