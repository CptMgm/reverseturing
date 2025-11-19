import React, { useState } from 'react';
import ConversationPanel from './ConversationPanel';
import VotingPanel from './VotingPanel';
import InterludeScreen from './InterludeScreen';
import GameStatus from './GameStatus';
import AudioControls from './AudioControls';
import dailyService from '../services/dailyService';

const VoiceCallUI = ({
  gamePhase,
  conversation,
  currentSpeaker,
  onHumanResponse,
  isProcessing,
  players,
  currentRound,
  onHumanVote,
  onContinueToVoting,
  onPlayAnotherRound,
  maxRounds,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [characterImages, setCharacterImages] = useState({});
  const isHumanTurn = currentSpeaker === 'human' && gamePhase === 'questioning';

  // Load character images from public folder (no subfolder needed)
  React.useEffect(() => {
    const loadImages = async () => {
      const images = {};
      const imageExtensions = ['png', 'jpg', 'jpeg', 'webp'];

      for (const player of players) {
        // Try both player name and player ID as filenames
        const possibleNames = [
          player.name.toLowerCase().replace(/\s+/g, '_'), // "Wario Amadeuss" -> "wario_amadeuss"
          player.name.toLowerCase().replace(/\s+/g, '-'), // "Wario Amadeuss" -> "wario-amadeuss"
          player.name.toLowerCase().replace(/\s+/g, ''),  // "Wario Amadeuss" -> "warioamadeuss"
          player.id                                        // "player2", "moderator", "human"
        ];

        let imageFound = false;
        for (const name of possibleNames) {
          if (imageFound) break;
          for (const ext of imageExtensions) {
            const imagePath = `/${name}.${ext}`;
            try {
              const response = await fetch(imagePath, { method: 'HEAD' });
              if (response.ok) {
                images[player.id] = imagePath;
                console.log(`✅ Found image for ${player.name}: ${imagePath}`);
                imageFound = true;
                break;
              }
            } catch (error) {
              // Image doesn't exist, continue to next option
            }
          }
        }

        if (!imageFound) {
          console.log(`⚠️ No image found for ${player.name}, will use letter avatar`);
        }
      }
      setCharacterImages(images);
    };

    loadImages();
  }, [players]);

  // Auto-mute when it's not the human's turn
  React.useEffect(() => {
    if (!isHumanTurn) {
      // Always mute when not human's turn
      dailyService.setLocalAudio(false);
    } else if (isHumanTurn) {
      // When it becomes human's turn, respect the muted state
      dailyService.setLocalAudio(!isMuted);
    }
  }, [isHumanTurn, isMuted]);

  const toggleMute = () => {
    // Only allow toggling during human's turn
    if (!isHumanTurn) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    dailyService.setLocalAudio(!newMutedState);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main video area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-white text-lg font-semibold">Reverse Turing Test</h1>
            <span className="text-gray-400 text-sm">
              Round {currentRound} - {gamePhase === 'questioning' ? 'Q&A' : gamePhase === 'voting' ? 'Voting' : 'Game'}
            </span>
          </div>
          <div className="text-cyan-400 text-sm">Voice Call Active</div>
        </div>

        {/* Participants grid - 2 rows like a normal video call */}
        <div className="flex-1 bg-gray-900 p-6 flex items-center justify-center">
          <div className="flex flex-col gap-4 max-w-6xl w-full">
            {/* Top row - first 2 players + President in middle + last player */}
            <div className="grid grid-cols-3 gap-4">
              {/* First player */}
              {players.filter(p => p.id !== 'moderator')[0] && (() => {
                const player = players.filter(p => p.id !== 'moderator')[0];
                return (
                  <div
                    key={player.id}
                    className={`
                      relative aspect-video rounded-lg overflow-hidden
                      ${currentSpeaker === player.id ? 'ring-4 ring-green-500' : 'ring-2 ring-gray-700'}
                      bg-gray-800 flex items-center justify-center
                    `}
                  >
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                      {characterImages[player.id] ? (
                        <img
                          src={characterImages[player.id]}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-3xl font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name tag */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{player.name}</span>
                        {currentSpeaker === player.id && (
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
                            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-150"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI indicator */}
                    {player.type === 'ai' && (
                      <div className="absolute top-2 right-2 bg-purple-600 px-2 py-1 rounded text-xs text-white">
                        AI
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* President in middle */}
              {players.filter(p => p.id === 'moderator').map((player) => (
                <div
                  key={player.id}
                  className={`
                    relative aspect-video rounded-lg overflow-hidden
                    ${currentSpeaker === player.id ? 'ring-4 ring-green-500' : 'ring-2 ring-gray-700'}
                    bg-gray-800 flex items-center justify-center
                  `}
                >
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center overflow-hidden">
                    {characterImages[player.id] ? (
                      <img
                        src={characterImages[player.id]}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name tag */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{player.name}</span>
                      {currentSpeaker === player.id && (
                        <div className="flex gap-1">
                          <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* President indicator */}
                  <div className="absolute top-2 right-2 bg-pink-600 px-2 py-1 rounded text-xs text-white">
                    PRESIDENT
                  </div>
                </div>
              ))}

              {/* Second player */}
              {players.filter(p => p.id !== 'moderator')[1] && (() => {
                const player = players.filter(p => p.id !== 'moderator')[1];
                return (
                  <div
                    key={player.id}
                    className={`
                      relative aspect-video rounded-lg overflow-hidden
                      ${currentSpeaker === player.id ? 'ring-4 ring-green-500' : 'ring-2 ring-gray-700'}
                      bg-gray-800 flex items-center justify-center
                    `}
                  >
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                      {characterImages[player.id] ? (
                        <img
                          src={characterImages[player.id]}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-3xl font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name tag */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{player.name}</span>
                        {currentSpeaker === player.id && (
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
                            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-150"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI indicator */}
                    {player.type === 'ai' && (
                      <div className="absolute top-2 right-2 bg-purple-600 px-2 py-1 rounded text-xs text-white">
                        AI
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Bottom row - remaining players */}
            <div className="grid grid-cols-3 gap-4">
              {players.filter(p => p.id !== 'moderator').slice(2).map((player) => (
                <div
                  key={player.id}
                  className={`
                    relative aspect-video rounded-lg overflow-hidden
                    ${currentSpeaker === player.id ? 'ring-4 ring-green-500' : 'ring-2 ring-gray-700'}
                    bg-gray-800 flex items-center justify-center
                  `}
                >
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                    {characterImages[player.id] ? (
                      <img
                        src={characterImages[player.id]}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name tag */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{player.name}</span>
                      {currentSpeaker === player.id && (
                        <div className="flex gap-1">
                          <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI indicator */}
                  {player.type === 'ai' && (
                    <div className="absolute top-2 right-2 bg-purple-600 px-2 py-1 rounded text-xs text-white">
                      AI
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            disabled={!isHumanTurn}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center transition-all
              ${!isHumanTurn ? 'bg-gray-800 opacity-50 cursor-not-allowed' :
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}
            `}
            title={!isHumanTurn ? 'Mic disabled (not your turn)' : isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Leave call button */}
          <button
            onClick={() => dailyService.leaveRoom()}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all"
            title="Leave call"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right sidebar - Chat/Voting */}
      <div className="w-96 bg-gray-800 flex flex-col border-l border-gray-700">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">
            {gamePhase === 'voting' ? 'Voting Time' : 'In-call messages'}
          </h2>
          <AudioControls />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Interlude Screen */}
          {gamePhase === 'interlude' && (
            <InterludeScreen
              onContinue={onContinueToVoting}
              onPlayAnotherRound={onPlayAnotherRound}
              currentRound={currentRound}
              maxRounds={maxRounds}
            />
          )}

          {/* Conversation during intro/questioning */}
          {(gamePhase === 'questioning' || gamePhase === 'intro') && (
            <ConversationPanel
              conversation={conversation}
              currentSpeaker={currentSpeaker}
              onHumanResponse={onHumanResponse}
              isHumanTurn={currentSpeaker === 'human' && gamePhase === 'questioning'}
              isProcessing={isProcessing}
              gamePhase={gamePhase}
            />
          )}

          {/* Voting phase - show conversation for AI turns */}
          {gamePhase === 'voting' && currentSpeaker !== 'human' && (
            <ConversationPanel
              conversation={conversation}
              currentSpeaker={currentSpeaker}
              onHumanResponse={() => {}}
              isHumanTurn={false}
              isProcessing={isProcessing}
              gamePhase={gamePhase}
            />
          )}

          {/* Voting phase - show voting panel for human turn */}
          {gamePhase === 'voting' && currentSpeaker === 'human' && (
            <VotingPanel
              players={players.filter(p => p.id !== 'human')}
              onVote={onHumanVote}
            />
          )}

          {/* Result phase */}
          {gamePhase === 'result' && (
            <div className="p-6">
              <div className="bg-gray-900 bg-opacity-90 p-6 rounded-lg backdrop-blur-sm">
                <p className="text-white text-center text-lg">
                  {conversation[conversation.length - 1]?.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Game Status at bottom */}
        <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
          <GameStatus gamePhase={gamePhase} currentRound={currentRound} />
        </div>
      </div>
    </div>
  );
};

export default VoiceCallUI;
