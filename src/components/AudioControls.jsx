import React, { useState, useEffect } from 'react';
import audioService from '../services/audioService';

const AudioControls = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechAvailable] = useState(audioService.speechRecognitionAvailable);

  useEffect(() => {
    const checkAudioStatus = () => {
      setIsListening(audioService.isCurrentlyListening);
      setIsPlaying(audioService.isCurrentlyPlaying);
    };

    const interval = setInterval(checkAudioStatus, 100);
    return () => clearInterval(interval);
  }, []);

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioService.setMuted(newMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioService.setVolume(newVolume);
    // Force unmute if volume is changed
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      audioService.setMuted(false);
    }
  };

  const handleStopAudio = () => {
    audioService.stopCurrentAudio();
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
      {/* Mute/Unmute Button */}
      <button
        onClick={handleMuteToggle}
        className={`p-2 rounded-lg transition-colors ${
          isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.75 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.75l3.633-3.814a1 1 0 011.617.814zm4.757 1.072a.5.5 0 01.708 0 7.5 7.5 0 010 10.607.5.5 0 01-.708-.708 6.5 6.5 0 000-9.191.5.5 0 010-.708z" />
            <path d="M11.29 8.293a1 1 0 011.414 0L14 9.586l1.293-1.293a1 1 0 111.414 1.414L15.414 11l1.293 1.293a1 1 0 01-1.414 1.414L14 12.414l-1.293 1.293a1 1 0 01-1.414-1.414L12.586 11l-1.293-1.293a1 1 0 010-1.414z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.75 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.75l3.633-3.814a1 1 0 011.617.814zM12.5 7.5a.5.5 0 01.5.5v4a.5.5 0 01-1 0V8a.5.5 0 01.5-.5zm2-2a.5.5 0 01.5.5v8a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2-2a.5.5 0 01.5.5v12a.5.5 0 01-1 0V4a.5.5 0 01.5-.5z" />
          </svg>
        )}
      </button>

      {/* Volume Slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Vol</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #0891b2 0%, #0891b2 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
          }}
        />
      </div>

      {/* Audio Status Indicators */}
      <div className="flex items-center gap-2">
        {isPlaying && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Speaking</span>
            <button
              onClick={handleStopAudio}
              className="text-xs text-red-400 hover:text-red-300 ml-1"
              title="Stop Audio"
            >
              Stop
            </button>
          </div>
        )}

        {isListening && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-400">Listening</span>
          </div>
        )}
      </div>

      {/* Speech Recognition Status */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${speechAvailable ? 'bg-green-500' : 'bg-gray-500'}`}></div>
        <span className="text-xs text-gray-400">
          {speechAvailable ? 'Voice' : 'No Voice'}
        </span>
      </div>
    </div>
  );
};

export default AudioControls;