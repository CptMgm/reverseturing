class AudioService {
  constructor() {
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentAudio = null;
    this.speechRecognition = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.isListening = false;
    
    this.setupSpeechRecognition();
  }

  // Text-to-Speech using ElevenLabs
  async speak(text, speaker = 'moderator') {
    if (this.isMuted || !text?.trim()) {
      console.log('TTS skipped:', this.isMuted ? 'muted' : 'empty text');
      return Promise.resolve();
    }
    
    console.log('TTS request:', { text: text.substring(0, 50) + '...', speaker });
    
    try {
      const response = await fetch('http://localhost:3001/api/tts', {
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

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('TTS rate limited, retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.speak(text, speaker); // Retry once
        }
        console.error('TTS request failed:', response.status, response.statusText);
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('TTS success, playing audio');
      
      return this.playAudio(audioUrl);
    } catch (error) {
      console.error('TTS Error:', error);
      return Promise.resolve(); // Fail silently for better UX
    }
  }

  async playAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.volume = this.volume;
      
      audio.onended = () => {
        console.log('Audio ended');
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        resolve();
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        reject(new Error('Audio playback failed'));
      };
      
      audio.oncanplay = () => {
        console.log('Audio ready to play');
      };
      
      this.currentAudio = audio;
      console.log('Starting audio playback, volume:', this.volume);
      audio.play().then(() => {
        console.log('Audio play started');
      }).catch((e) => {
        console.error('Audio play failed:', e);
        reject(e);
      });
    });
  }

  // Queue system for managing multiple speakers
  async queueSpeech(text, speaker) {
    return new Promise((resolve) => {
      const speechPromise = async () => {
        await this.speak(text, speaker);
        resolve(); // Resolve when this specific speech is done
      };
      
      if (!this.isPlaying) {
        this.isPlaying = true;
        speechPromise().finally(() => {
          this.isPlaying = false;
          this.processQueue();
        });
      } else {
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

  // Start speech recognition
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

  // Check if speech recognition is available
  get speechRecognitionAvailable() {
    return !!this.speechRecognition;
  }

  get isCurrentlyPlaying() {
    return this.isPlaying;
  }

  get isCurrentlyListening() {
    return this.isListening;
  }
}

export default new AudioService();