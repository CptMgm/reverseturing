import DailyIframe from '@daily-co/daily-js';

class DailyService {
  constructor() {
    this.callObject = null;
    this.roomUrl = null;
    this.isJoined = false;
    this.currentCustomTrack = null;
  }

  async createAndJoinRoom() {
    try {
      // Create room via backend
      const response = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create Daily room');
      }

      const { url, name } = await response.json();
      console.log('📞 Daily room created:', name);

      this.roomUrl = url;

      // Create Daily call object
      this.callObject = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: false, // Audio-only for now
      });

      // Set up event listeners
      this.setupEventListeners();

      // Join the room
      await this.callObject.join({ url: this.roomUrl });
      console.log('✅ Joined Daily room');

      this.isJoined = true;

      return { url, name };
    } catch (error) {
      console.error('❌ Daily room creation/join error:', error);
      throw error;
    }
  }

  setupEventListeners() {
    if (!this.callObject) return;

    this.callObject
      .on('joined-meeting', () => {
        console.log('🎉 Joined meeting');
      })
      .on('left-meeting', () => {
        console.log('👋 Left meeting');
        this.isJoined = false;
      })
      .on('participant-joined', (event) => {
        console.log('👤 Participant joined:', event.participant.user_name);
      })
      .on('participant-left', (event) => {
        console.log('👤 Participant left:', event.participant.user_name);
      })
      .on('error', (error) => {
        console.error('❌ Daily error:', error);
      });
  }

  async playAudioForBot(audioBlob, botName) {
    if (!this.callObject || !this.isJoined) {
      console.error('❌ Cannot play audio: not joined to Daily room');
      return;
    }

    try {
      // Stop any existing custom track first to avoid producer limit
      if (this.currentCustomTrack) {
        try {
          await this.callObject.stopCustomTrack();
          this.currentCustomTrack = null;
        } catch (e) {
          console.warn('⚠️ Error stopping previous track:', e);
        }
      }

      // Convert blob to audio element
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Create audio context to capture stream
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();

      // Audio processing (compression only - phone effect now applied in ElevenLabs)
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      // Connect the chain: source -> compressor -> destination/speakers
      source.connect(compressor);
      compressor.connect(destination);
      compressor.connect(audioContext.destination); // Also play locally

      // Start custom audio track in Daily
      const track = destination.stream.getAudioTracks()[0];
      this.currentCustomTrack = track;

      await this.callObject.startCustomTrack({
        track: track,
        mode: 'music', // Better quality for TTS
      });

      console.log(`🔊 Playing audio for ${botName}`);

      // Play the audio and wait for it to finish
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          if (this.currentCustomTrack === track) {
            this.callObject.stopCustomTrack().catch(e => console.warn('⚠️ Error stopping track:', e));
            this.currentCustomTrack = null;
          }
          URL.revokeObjectURL(audioUrl);
          console.log(`✅ Finished playing audio for ${botName}`);
          resolve();
        };

        audio.onerror = (error) => {
          console.error('❌ Audio playback error:', error);
          if (this.currentCustomTrack === track) {
            this.callObject.stopCustomTrack().catch(e => console.warn('⚠️ Error stopping track:', e));
            this.currentCustomTrack = null;
          }
          URL.revokeObjectURL(audioUrl);
          resolve(); // Resolve even on error to continue game flow
        };

        audio.play().catch((error) => {
          console.error('❌ Audio play() error:', error);
          if (this.currentCustomTrack === track) {
            this.callObject.stopCustomTrack().catch(e => console.warn('⚠️ Error stopping track:', e));
            this.currentCustomTrack = null;
          }
          URL.revokeObjectURL(audioUrl);
          resolve(); // Resolve even on error to continue game flow
        });
      });

    } catch (error) {
      console.error('❌ Error playing audio in Daily:', error);
      this.currentCustomTrack = null;
      return Promise.resolve(); // Return resolved promise on error
    }
  }

  async leaveRoom() {
    if (this.callObject) {
      await this.callObject.leave();
      this.callObject.destroy();
      this.callObject = null;
      this.isJoined = false;
      console.log('👋 Left Daily room');
    }
  }

  getParticipants() {
    if (!this.callObject) return {};
    return this.callObject.participants();
  }

  setLocalAudio(enabled) {
    if (!this.callObject) return;
    this.callObject.setLocalAudio(enabled);
  }
}

// Export singleton instance
export const dailyService = new DailyService();
export default dailyService;
