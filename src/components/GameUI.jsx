import React from 'react';
import ConversationPanel from './ConversationPanel';
import VotingPanel from './VotingPanel';
import GameStatus from './GameStatus';
import AudioControls from './AudioControls';
import InterludeScreen from './InterludeScreen';

const GameUI = ({
  gamePhase,
  conversation,
  currentSpeaker,
  onHumanResponse,
  isProcessing,
  players,
  onHumanVote,
  onContinueToVoting,
  onPlayAnotherRound,
  currentRound,
  maxRounds
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Interlude Screen - Full screen overlay */}
      {gamePhase === 'interlude' && (
        <InterludeScreen
          onContinue={onContinueToVoting}
          onPlayAnotherRound={onPlayAnotherRound}
          currentRound={currentRound}
          maxRounds={maxRounds}
        />
      )}

      <div className="h-full flex flex-col justify-end p-4">
        <div className="pointer-events-auto">
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
          
          {gamePhase === 'voting' && currentSpeaker !== 'human' && (
            <ConversationPanel
              conversation={conversation}
              currentSpeaker={currentSpeaker}
              onHumanResponse={() => {}} // No human input during voting
              isHumanTurn={false}
              isProcessing={isProcessing}
              gamePhase={gamePhase}
            />
          )}
          
          {gamePhase === 'voting' && currentSpeaker === 'human' && (
            <VotingPanel
              players={players.filter(p => p.id !== 'human')}
              onVote={onHumanVote}
            />
          )}
          
          {gamePhase === 'result' && (
            <div className="bg-gray-900 bg-opacity-90 p-6 rounded-lg max-w-2xl mx-auto backdrop-blur-sm">
              <p className="text-white text-center text-xl">
                {conversation[conversation.length - 1]?.message}
              </p>
            </div>
          )}
        </div>
      </div>

      <GameStatus gamePhase={gamePhase} currentRound={currentRound} />
      
      {/* Audio Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <AudioControls />
      </div>
    </div>
  );
};

export default GameUI;