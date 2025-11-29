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
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if user is currently speaking
  const [showModeSelection, setShowModeSelection] = useState(false);
  const modeSelectedRef = useRef(false); // Track if mode was already selected
  const wsRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef(null); // Store currently playing audio element
  const callObjectRef = useRef(null);

  const recognitionRef = useRef(null);

  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const audioQueueBufferRef = useRef([]); // Buffer for chunks if SourceBuffer is updating

  const stopAudio = () => {
    console.log('🛑 [GameContext] Stopping all audio playback');
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      if (currentAudioRef.current.src) {
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    // Cleanup MediaSource
    if (mediaSourceRef.current) {
      try {
        if (sourceBufferRef.current && sourceBufferRef.current.updating) {
          sourceBufferRef.current.abort();
        }
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      } catch (e) {
        // Ignore error if already closed or invalid state
        console.warn('⚠️ [GameContext] MediaSource cleanup warning:', e);
      }
      mediaSourceRef.current = null;
      sourceBufferRef.current = null;
    }
    audioQueueBufferRef.current = [];

    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setGameState(prev => ({ ...prev, activeSpeaker: null }));
  };

  const handleStreamStart = (payload) => {
    console.log(`🌊 [GameContext] Starting audio stream for ${payload.playerId}`);
    stopAudio(); // Ensure clean slate

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    const audio = new Audio();
    audio.src = URL.createObjectURL(mediaSource);
    currentAudioRef.current = audio;

    // Set active speaker immediately
    setGameState(prev => ({ ...prev, activeSpeaker: payload.playerId }));
    isPlayingRef.current = true;

    mediaSource.addEventListener('sourceopen', () => {
      try {
        // ElevenLabs returns MP3 chunks
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        sourceBufferRef.current = sourceBuffer;

        sourceBuffer.addEventListener('updateend', () => {
          if (audioQueueBufferRef.current.length > 0 && sourceBufferRef.current && !sourceBufferRef.current.updating) {
            const nextChunk = audioQueueBufferRef.current.shift();
            try {
              sourceBufferRef.current.appendBuffer(nextChunk);
            } catch (e) {
              console.error('Error appending buffer from queue:', e);
            }
          }
        });

        console.log('✅ [GameContext] MediaSource opened and buffer ready');
        audio.play().catch(e => console.error('Stream playback failed:', e));
      } catch (e) {
        console.error('❌ [GameContext] Failed to add SourceBuffer:', e);
      }
    });

    audio.onended = () => {
      console.log(`⏹️ [GameContext] Stream ended for ${payload.playerId}`);
      isPlayingRef.current = false;
      setGameState(prev => ({ ...prev, activeSpeaker: null }));
      URL.revokeObjectURL(audio.src);

      // CRITICAL FIX: Send AUDIO_COMPLETE to server
      finishAudio(payload.playerId);
    };
  };

  const handleAudioChunk = (payload) => {
    if (!sourceBufferRef.current || !mediaSourceRef.current) return;

    try {
      const binaryString = window.atob(payload.chunk);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (sourceBufferRef.current.updating || audioQueueBufferRef.current.length > 0) {
        audioQueueBufferRef.current.push(bytes);
      } else {
        sourceBufferRef.current.appendBuffer(bytes);
      }
    } catch (e) {
      console.error('❌ [GameContext] Error handling audio chunk:', e);
    }
  };

  const handleStreamEnd = () => {
    if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
      try {
        // Wait for buffer to finish updating before ending stream?
        // Actually endOfStream() can be called even if buffer is updating? No, it throws.
        // We should wait.
        const finishStream = () => {
          if (sourceBufferRef.current && !sourceBufferRef.current.updating && audioQueueBufferRef.current.length === 0) {
            mediaSourceRef.current.endOfStream();
            console.log('🏁 [GameContext] MediaSource stream ended signal received');
          } else {
            setTimeout(finishStream, 100);
          }
        };
        finishStream();
      } catch (e) {
        console.error('Error ending stream:', e);
      }
    }
  };

  // Correct commonly misheard character names in speech recognition
  const correctCharacterNames = (text) => {
    // Case-insensitive replacement for common mishearings
    let corrected = text;

    // Domis corrections
    corrected = corrected.replace(/\bthomas\b/gi, 'Domis');
    corrected = corrected.replace(/\bdennis\b/gi, 'Domis');
    corrected = corrected.replace(/\bdominique\b/gi, 'Domis');

    // Wario corrections
    corrected = corrected.replace(/\bwarrior\b/gi, 'Wario');
    corrected = corrected.replace(/\bmario\b/gi, 'Wario');

    // Scan corrections
    corrected = corrected.replace(/\bscan\s*control\s*altman\b/gi, 'Scan');
    corrected = corrected.replace(/\bsean\b/gi, 'Scan');

    return corrected;
  };

  const startVoiceMode = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('❌ [GameContext] SpeechRecognition not supported in this browser.');
      setSystemError('Voice Mode not supported in this browser (try Chrome).');
      return;
    }

    console.log('🎤 [GameContext] Starting Voice Mode (SpeechRecognition)...');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 [GameContext] Voice recognition started');
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ [GameContext] Speech detected (Barge-in triggered)');
      setIsSpeaking(true);

      // 1. Stop local audio immediately
      stopAudio();

      // 2. Tell server to stop generating/queuing
      if (wsRef.current && isConnected) {
        wsRef.current.send(JSON.stringify({ type: 'AUDIO_INTERRUPT' }));
      }
    };

    recognition.onspeechend = () => {
      console.log('🤫 [GameContext] Speech ended');
      setIsSpeaking(false);
    };

    recognition.onresult = (event) => {
      let transcript = event.results[event.results.length - 1][0].transcript;
      console.log(`🗣️ [GameContext] Heard (raw): "${transcript}"`);

      // Correct commonly misheard character names
      transcript = correctCharacterNames(transcript);
      console.log(`🗣️ [GameContext] Corrected: "${transcript}"`);

      if (transcript.trim().length > 0) {
        sendHumanInput(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ [GameContext] Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSystemError('Microphone access denied. Please allow microphone access.');
        // Do not restart if permission denied
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      console.log('🎤 [GameContext] Voice recognition ended.');
      // Auto-restart if mode is still voice (unless explicitly stopped or permission denied)
      if (communicationMode === 'voice' && recognitionRef.current) {
        console.log('🔄 [GameContext] Restarting recognition in 1s...');
        setTimeout(() => {
          if (communicationMode === 'voice' && recognitionRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.log('⚠️ [GameContext] Could not restart recognition:', e);
            }
          }
        }, 1000); // 1 second backoff to prevent tight loops
      }
    };

    // BARGE-IN LOGIC: Detect speech start to interrupt AI
    // Note: 'onspeechstart' is not reliably supported in all browsers/implementations of Web Speech API.
    // 'onsoundstart' or 'onaudiostart' might be alternatives, but often fire on noise.
    // For MVP, let's try 'onspeechstart'. If it fails, we might need a separate VAD (hark.js) later.
    recognition.onspeechstart = () => {
      console.log('🗣️ [GameContext] Speech detected (Barge-in triggered)');

      // 1. Stop local audio immediately
      stopAudio();

      // 2. Tell server to stop generating/queuing
      if (wsRef.current && isConnected) {
        wsRef.current.send(JSON.stringify({ type: 'AUDIO_INTERRUPT' }));
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('❌ [GameContext] Failed to start recognition:', e);
    }
  };

  const stopVoiceMode = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      console.log('🎤 [GameContext] Stopped Voice Mode');
    }
  };

  // Helper to convert Float32 to Int16
  const convertFloat32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  useEffect(() => {
    // Connect to WebSocket with authentication
    // Determine WebSocket URL based on environment
    const getWebSocketUrl = () => {
      // Check if we're in production (Lovable frontend)
      const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

      // Use environment variable if available, otherwise detect
      let backendUrl = import.meta.env.VITE_BACKEND_URL ||
        (isProduction ? 'https://reverse-turing-backend-271123520248.us-central1.run.app' : 'http://localhost:3001');

      // Convert HTTP(S) to WS(S) for WebSocket connection
      backendUrl = backendUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

      // Get auth token from localStorage
      const authToken = localStorage.getItem('gameAuthToken');

      // Add token as query parameter if it exists
      if (authToken) {
        return `${backendUrl}?token=${authToken}`;
      }

      return backendUrl;
    };

    const wsUrl = getWebSocketUrl();

    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'));
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

          case 'AUDIO_STREAM_START':
            handleStreamStart(data.payload);
            break;

          case 'AUDIO_CHUNK':
            handleAudioChunk(data.payload);
            break;

          case 'AUDIO_STREAM_END':
            handleStreamEnd();
            break;

          case 'AUDIO_INTERRUPT':
            console.log('⏸️ Interrupting current audio playback');
            stopAudio();
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

    ws.onclose = (event) => {
      console.log('❌ WebSocket Disconnected');
      setIsConnected(false);

      // Check if connection was closed due to authentication failure
      if (event.code === 4401) {
        console.error('🔒 Authentication failed - invalid or missing token');
        setSystemError('Authentication failed. Please refresh and enter the password again.');
        // Clear invalid token
        localStorage.removeItem('gameAuthToken');
      }
    };

    return () => {
      ws.close();
      stopAudio(); // Ensure audio stops when component unmounts
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

      console.log(`🔍 [Client] Audio data present: ${!!item.audioData}, Length: ${item.audioData?.length || 0}, ContentType: ${item.contentType || 'not specified'}`);

      if (item.audioData && item.audioData.length > 100) { // Basic validation
        // Play server-provided audio with phone call effect
        // Use dynamic content type (wav for Gemini, mpeg for ElevenLabs)
        const mimeType = item.contentType || 'audio/mpeg';
        console.log(`🎵 [Client] Creating audio with MIME type: ${mimeType}`);
        const audio = new Audio(`data:${mimeType};base64,${item.audioData}`);
        audio.volume = 1.0; // Max volume

        // Wait for audio to load before playing
        audio.addEventListener('loadedmetadata', () => {
          console.log(`📊 [Client] Audio loaded - Duration: ${audio.duration}s, Volume: ${audio.volume}`);
        });

        audio.addEventListener('error', (e) => {
          console.error(`❌ [Client] Audio element error:`, e, audio.error);
        });

        // TEMPORARILY DISABLE PHONE EFFECT TO DEBUG
        // Phone effect causes issues with Web Audio API - needs debugging
        const ENABLE_PHONE_EFFECT = false; // TODO: Fix Web Audio API phone effect

        if (ENABLE_PHONE_EFFECT) {
          try {
            // Use persistent AudioContext
            const audioContext = getAudioContext();

            // Resume context if suspended (fixes "first syllable cut-off")
            if (audioContext.state === 'suspended') {
              console.log(`🔊 [Client] Resuming AudioContext (was ${audioContext.state})`);
              await audioContext.resume();
              console.log(`✅ [Client] AudioContext resumed (now ${audioContext.state})`);
            }

            console.log(`🎚️ [Client] Creating MediaElementSource for ${item.playerId}`);
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
          console.log(`🔊 [Client] Audio element state - readyState: ${audio.readyState}, paused: ${audio.paused}, muted: ${audio.muted}`);
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
        // Get backend URL (use HTTPS for API calls)
        const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
        const backendUrl = import.meta.env.VITE_BACKEND_URL ||
          (isProduction ? 'https://reverse-turing-backend-271123520248.us-central1.run.app' : 'http://localhost:3001');

        await fetch(`${backendUrl}/api/game/audio-complete`, {
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
    // Optimistic update: Show message immediately in UI
    const optimisticMsg = {
      playerId: 'player1',
      speaker: gameState.players.player1?.name || 'You',
      text: text,
      timestamp: Date.now()
    };

    setGameState(prev => ({
      ...prev,
      transcript: [...(prev.transcript || []), optimisticMsg]
    }));

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

  const selectCommunicationMode = async (mode) => {
    console.log(`🎤 [GameContext] Selecting communication mode: ${mode}`);
    setCommunicationMode(mode);
    setShowModeSelection(false);
    modeSelectedRef.current = true;

    // Send mode to server
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'SET_COMMUNICATION_MODE',
        payload: { mode }
      }));
    }

    // Initialize audio context (needed for both modes for playback)
    try {
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      console.log('🔊 [GameContext] AudioContext initialized/resumed');
    } catch (e) {
      console.error('❌ [GameContext] Failed to initialize AudioContext:', e);
    }

    // If Voice Mode, start capturing audio
    if (mode === 'voice') {
      startVoiceMode();
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
      isSpeaking,
      sendTypingEvent,
      startVoiceMode,
      stopVoiceMode,
      resetGame: () => {
        stopAudio(); // Stop local audio immediately

        // Reset client-side state
        setCommunicationMode(null);
        setShowModeSelection(false);
        modeSelectedRef.current = false; // Reset mode selection flag
        setIsSpeaking(false);

        // Send reset to server
        if (wsRef.current && isConnected) {
          wsRef.current.send(JSON.stringify({ type: 'RESET_GAME' }));
        }
      }
    }}>
      {children}
    </GameContext.Provider>
  );
};