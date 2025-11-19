import React, { useState, useEffect, useRef } from 'react';
import audioService from '../services/audioService';
import TypingMessage from './TypingMessage';

const ConversationPanel = ({
  conversation,
  currentSpeaker,
  onHumanResponse,
  isHumanTurn,
  isProcessing,
  gamePhase
}) => {
  const [userInput, setUserInput] = useState('');
  const [useVoiceInput, setUseVoiceInput] = useState(true); // Default ON
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const messagesEndRef = useRef(null);
  const hasAutoStartedListening = useRef(false);

  const MAX_CHARACTERS = 230;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Auto-start voice input when it's the human's turn
  useEffect(() => {
    if (isHumanTurn && useVoiceInput && !isListening && !hasAutoStartedListening.current && audioService.speechRecognitionAvailable) {
      // Auto-trigger voice input when it becomes the player's turn
      console.log('🎤 Auto-starting voice input for player turn');
      hasAutoStartedListening.current = true;
      handleVoiceInput();
    }

    // Reset flag when it's no longer human's turn
    if (!isHumanTurn) {
      hasAutoStartedListening.current = false;
    }
  }, [isHumanTurn, useVoiceInput, isListening]);

  // Removed automatic TTS - now handled by GameScene to prevent duplicates

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim() && isHumanTurn && !isProcessing) {
      onHumanResponse(userInput.trim());
      setUserInput('');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARACTERS) {
      setUserInput(value);
    }
  };

  const handleVoiceInput = async () => {
    if (!audioService.speechRecognitionAvailable) {
      setVoiceError('Speech recognition not available');
      return;
    }

    setIsListening(true);
    setVoiceError('');

    try {
      const transcript = await audioService.startListening();
      // Truncate to max characters if voice input exceeds limit
      setUserInput(transcript.substring(0, MAX_CHARACTERS));
      setIsListening(false);
    } catch (error) {
      setVoiceError(error.message);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    audioService.stopListening();
    setIsListening(false);
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 max-w-4xl mx-auto backdrop-blur-sm h-full flex flex-col">
      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {conversation.map((msg, index) => {
          // Use shouldAnimate property from message
          const isLatestMessage = index === conversation.length - 1;
          const shouldAnimate = isLatestMessage && msg.shouldAnimate;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg transition-all ${
                msg.speakerId === 'human'
                  ? 'bg-cyan-800 bg-opacity-50 ml-8'
                  : msg.speakerId === 'moderator'
                  ? 'bg-gray-700 mx-4'
                  : 'bg-purple-800 bg-opacity-50 mr-8'
              }`}
            >
              <div className="font-bold text-sm text-gray-300 mb-1 flex items-center gap-2">
                {msg.speakerName}
                {msg.speakerId === currentSpeaker && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="text-white leading-relaxed">
                {shouldAnimate ? (
                  <TypingMessage message={msg.message} speed={20} />
                ) : (
                  msg.message
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isHumanTurn && (
        <div className="space-y-2">
          {/* Voice controls */}
          {audioService.speechRecognitionAvailable && (
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setUseVoiceInput(!useVoiceInput)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  useVoiceInput 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Voice Input {useVoiceInput ? 'ON' : 'OFF'}
              </button>
              
              {useVoiceInput && (
                <div className="flex items-center gap-2">
                  {!isListening ? (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                      </svg>
                      Hold to Speak
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="px-3 py-1 bg-red-700 text-white rounded text-sm flex items-center gap-1 animate-pulse"
                    >
                      <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
                      Listening...
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Voice error display */}
          {voiceError && (
            <div className="text-red-400 text-sm">
              Voice error: {voiceError}
            </div>
          )}

          {/* Character count */}
          <div className="text-right text-sm mb-1">
            <span className={userInput.length >= MAX_CHARACTERS ? 'text-red-400' : 'text-gray-400'}>
              {userInput.length} / {MAX_CHARACTERS}
            </span>
          </div>

          {/* Text input form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder={isProcessing ? "AI is responding..." : useVoiceInput ? "Speak or type your response..." : "Type your response..."}
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              disabled={isProcessing || isListening}
              autoFocus={!useVoiceInput}
              maxLength={MAX_CHARACTERS}
            />
            <button
              type="submit"
              disabled={!userInput.trim() || isProcessing || isListening}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Status Indicator */}
      {!isHumanTurn && (
        <div className="text-center py-2">
          <div className="text-gray-400">
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                AI is thinking...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Waiting for {currentSpeaker}...
                {audioService.isCurrentlyPlaying && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationPanel;