import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const GameContext = createContext();

export const useGame = () => {
  return useContext(GameContext);
};

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    phase: 'LOBBY',
    players: {},
    votes: {},
    transcript: [],
    activeSpeaker: null
  });

  const [isConnected, setIsConnected] = useState(false);
  const [dailyUrl, setDailyUrl] = useState(null);
  const [systemError, setSystemError] = useState(null);
  const [communicationMode, setCommunicationMode] = useState(null); // 'voice' or 'text'
  const [showModeSelection, setShowModeSelection] = useState(false);
  const modeSelectedRef = useRef(false); // Track if mode was already selected
  const wsRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef(null); // Store currently playing audio element
  const callObjectRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    // Hardcoded to localhost:3001 for development as backend runs on a different port than frontend
    const wsUrl = 'ws://localhost:3001';

    console.log('🔌 Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received:', data.type);

        switch (data.type) {
          case 'GAME_STATE':
            setGameState(prevState => ({
              ...prevState,
              ...data.payload
            }));

            // Show mode selection when president intro starts (only once)
            if (data.payload.phase === 'PRESIDENT_INTRO' && !modeSelectedRef.current) {
              setShowModeSelection(true);
            }
            break;

          case 'AUDIO_PLAYBACK':
            queueAudio(data.payload);
            break;

          case 'AUDIO_INTERRUPT':
            console.log('⏸️ Interrupting current audio playback');
            // Stop current audio and clear queue
            if (currentAudioRef.current) {
              currentAudioRef.current.pause();
              currentAudioRef.current.currentTime = 0;
              currentAudioRef.current = null;
            }
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            setGameState(prev => ({ ...prev, activeSpeaker: null }));
            break;

          case 'DAILY_ROOM':
            setDailyUrl(data.payload.url);
            break;

          case 'SYSTEM_ERROR':
            console.error('❌ SYSTEM ERROR:', data.payload.message);
            setSystemError(data.payload.message);
            // Auto-clear error after 10 seconds
            setTimeout(() => setSystemError(null), 10000);
            break;
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('❌ WebSocket Disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Play drop-off sound when someone is eliminated
  const previousEliminatedRef = useRef([]);
  useEffect(() => {
    const currentEliminated = gameState.eliminatedPlayers || [];
    const previousEliminated = previousEliminatedRef.current;

    // Check if a new player was eliminated
    if (currentEliminated.length > previousEliminated.length) {
      console.log('💀 Player eliminated - playing drop-off sound');
      // Play call drop-off sound (similar to Zoom/Skype disconnect)
      const dropSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      dropSound.volume = 0.6;
      dropSound.play().catch(e => console.log('Drop sound failed:', e));
    }

    previousEliminatedRef.current = currentEliminated;
  }, [gameState.eliminatedPlayers]);

  // Play buzzer sound when round timer expires
  const previousPhaseRef = useRef(null);
  useEffect(() => {
    const currentPhase = gameState.phase;
    const previousPhase = previousPhaseRef.current;

    // Check if we transitioned from a ROUND to an ELIMINATION phase
    if (previousPhase && previousPhase.startsWith('ROUND_') && currentPhase.startsWith('ELIMINATION_')) {
      console.log('⏰ Round ended - playing buzzer sound');
      // Play alarm/buzzer sound (round time up)
      const buzzerSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1786/1786-preview.mp3');
      buzzerSound.volume = 0.5;
      buzzerSound.play().catch(e => console.log('Buzzer sound failed:', e));
    }

    previousPhaseRef.current = currentPhase;
  }, [gameState.phase]);

  // Audio Playback Queue
  const queueAudio = (payload) => {
    console.log('🔊 Queuing audio from:', payload.playerId);
    audioQueueRef.current.push(payload);
    processAudioQueue();
  };

  // Persistent AudioContext to avoid autoplay blocks
  const audioContextRef = useRef(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const startGame = (playerName) => {
    // Unlock audio context on user interaction
    getAudioContext();
    const unlockAudio = new Audio();
    unlockAudio.play().catch(e => console.log('Audio unlock attempt:', e));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const name = playerName || "Player 1"; // Fallback
      wsRef.current.send(JSON.stringify({
        type: 'START_GAME',
        payload: { playerName: name }
      }));
    }
  };

  const processAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const item = audioQueueRef.current.shift();

    try {
      // Update active speaker in UI
      setGameState(prev => ({ ...prev, activeSpeaker: item.playerId }));

      console.log(`🔍 [Client] Audio data present: ${!!item.audioData}, Length: ${item.audioData?.length || 0}`);

      if (item.audioData && item.audioData.length > 100) { // Basic validation
        // Play server-provided audio with phone call effect
        // Use audio/mpeg for MP3 data from ElevenLabs
        const audio = new Audio(`data:audio/mpeg;base64,${item.audioData}`);
        audio.volume = 1.0; // Max volume

        // Wait for audio to load before playing
        audio.addEventListener('loadedmetadata', () => {
          console.log(`📊 [Client] Audio loaded - Duration: ${audio.duration}s, Volume: ${audio.volume}`);
        });

        // TEMPORARILY DISABLE PHONE EFFECT TO DEBUG
        const ENABLE_PHONE_EFFECT = true; // Enabled for all AI players

        if (ENABLE_PHONE_EFFECT) {
          try {
            // Use persistent AudioContext
            const audioContext = getAudioContext();
            const source = audioContext.createMediaElementSource(audio);

            // Create bandpass filter for phone call effect (300Hz - 3400Hz)
            const lowpass = audioContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 3400; // Cut off high frequencies

            const highpass = audioContext.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 300; // Cut off low frequencies

            // Add slight distortion for realism
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -20;
            compressor.knee.value = 10;
            compressor.ratio.value = 4;

            // Connect the audio chain
            source.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(compressor);
            compressor.connect(audioContext.destination);

            console.log(`🎧 [Client] Phone effect applied for ${item.playerId}`);

            // Clean up nodes when audio ends
            audio.addEventListener('ended', () => {
              source.disconnect();
              highpass.disconnect();
              lowpass.disconnect();
              compressor.disconnect();
            });

          } catch (audioError) {
            console.warn(`⚠️ [Client] Could not apply phone effect, using raw audio:`, audioError);
            // If Web Audio API fails, audio will still play without effect
          }
        } else {
          console.log(`🎵 [Client] Playing audio WITHOUT phone effect for ${item.playerId}`);
        }

        // Handle playback errors (e.g. Autoplay blocked)
        try {
          console.log(`▶️ [Client] Playing audio for ${item.playerId} (duration: ${audio.duration || 'unknown'}s)`);
          await audio.play();
          currentAudioRef.current = audio; // Store reference to current audio
          console.log(`✅ [Client] Audio started playing for ${item.playerId}`);
        } catch (playError) {
          console.error('❌ Playback failed:', playError);
          console.error('Audio src length:', item.audioData?.length);
          setSystemError(`Audio Playback Error: ${playError.message}`);

          // Even if playback fails, we MUST finish the item so the game proceeds
          setTimeout(() => {
            finishAudio(item.playerId);
          }, 2000);
          return;
        }

        audio.onended = () => {
          console.log(`⏹️ [Client] Audio ended for ${item.playerId}`);
          currentAudioRef.current = null; // Clear reference
          finishAudio(item.playerId);
        };

        // Safety timeout: if audio is long or onended fails, force finish after 30s
        // This prevents the game from getting stuck forever
        setTimeout(() => {
          if (isPlayingRef.current && gameState.activeSpeaker === item.playerId) {
            console.warn('⚠️ Audio safety timeout triggered');
            finishAudio(item.playerId);
          }
        }, 30000);

        // Fallback if onended doesn't fire for some reason
        audio.onerror = (e) => {
          console.error('Audio element error:', e);
          finishAudio(item.playerId);
        };

      } else {
        console.error('❌ No audio data received for:', item.playerId);
        // User requested NO fallbacks and explicit errors
        setSystemError(`Missing Audio for ${item.playerId}. Check server logs/API keys.`);

        // We still need to "finish" the audio so the queue doesn't get stuck, 
        // but we'll delay it slightly to let the user see the error.
        setTimeout(() => {
          finishAudio(item.playerId);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      finishAudio(item.playerId);
    }
  };

  const finishAudio = async (playerId) => {
    console.log(`🏁 [Client] finishAudio called for ${playerId}`);
    isPlayingRef.current = false;
    setGameState(prev => ({ ...prev, activeSpeaker: null }));

    // Notify backend that audio finished
    if (wsRef.current && isConnected) {
      console.log(`📤 [Client] Sending AUDIO_COMPLETE via WS for ${playerId}`);
      wsRef.current.send(JSON.stringify({
        type: 'AUDIO_COMPLETE',
        payload: { playerId }
      }));
    } else {
      console.warn('⚠️ [Client] WS disconnected. Sending AUDIO_COMPLETE via HTTP fallback...');
      try {
        await fetch('http://localhost:3001/api/game/audio-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId })
        });
        console.log(`✅ [Client] HTTP fallback success for ${playerId}`);
      } catch (e) {
        console.error(`❌ [Client] HTTP fallback failed for ${playerId}:`, e);
      }
    }

    processAudioQueue();
  };

  const sendHumanInput = (text) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'HUMAN_INPUT',
        payload: { text }
      }));
    }
  };

  const callPresident = () => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'CALL_PRESIDENT' }));
    }
  };

  const castVote = (targetPlayerId) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'CAST_VOTE',
        payload: { targetPlayerId }
      }));
    }
  };

  const selectCommunicationMode = (mode) => {
    console.log(`🎙️ [GameContext] User selected ${mode} mode`);

    // Mark as selected (prevents modal from reopening)
    modeSelectedRef.current = true;
    setCommunicationMode(mode);
    setShowModeSelection(false);

    // Unlock audio context on user interaction (critical for autoplay)
    getAudioContext();
    const unlockAudio = new Audio();
    unlockAudio.play().catch(e => console.log('Audio unlock attempt:', e));

    // Send mode to server
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'SET_COMMUNICATION_MODE',
        payload: { mode }
      }));
    }

    // If text mode selected, announce it to the AIs
    if (mode === 'text') {
      // Send automatic message after a short delay
      setTimeout(() => {
        sendHumanInput("Sorry folks, my mic doesn't work. I'll use text chat.");
      }, 1000);
    }
  };

  const sendTypingEvent = (isTyping) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: isTyping ? 'USER_TYPING_START' : 'USER_TYPING_STOP'
      }));
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      isConnected,
      startGame,
      sendHumanInput,
      callPresident,
      castVote,
      dailyUrl,
      systemError,
      communicationMode,
      showModeSelection,
      selectCommunicationMode,
      sendTypingEvent
    }}>
      {children}
    </GameContext.Provider>
  );
};