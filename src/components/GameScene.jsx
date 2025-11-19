import React, { useEffect } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import VoiceCallUI from './VoiceCallUI';
import ErrorBoundary from './ErrorBoundary';

const GameScene = ({ playerName, onComplete }) => {
  console.log('🎮 GameScene render with player:', playerName);

  const {
    gamePhase,
    conversation,
    currentSpeaker,
    handleHumanResponse,
    handleHumanVote,
    isProcessing,
    players,
    currentRound,
    maxRounds,
    startVotingPhase,
    startAnotherRound,
  } = useGameLogic(playerName, onComplete);

  // Monitor game completion
  useEffect(() => {
    if (gamePhase === 'result') {
      console.log('🏁 Game complete! Phase:', gamePhase);
      // Wait a moment for final messages to be spoken
      const timer = setTimeout(() => {
        // Extract game result from conversation
        const lastMessage = conversation[conversation.length - 1];
        const result = {
          won: lastMessage?.message?.toLowerCase().includes(playerName.toLowerCase()),
          score: 0,
          totalVotes: players.length,
          voteDetails: {}
        };
        onComplete(result);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, conversation, onComplete, playerName, players]);

  return (
    <ErrorBoundary>
      <VoiceCallUI
        gamePhase={gamePhase}
        conversation={conversation}
        currentSpeaker={currentSpeaker}
        onHumanResponse={handleHumanResponse}
        isProcessing={isProcessing}
        players={players}
        currentRound={currentRound}
        onHumanVote={handleHumanVote}
        onContinueToVoting={startVotingPhase}
        onPlayAnotherRound={startAnotherRound}
        maxRounds={maxRounds}
      />
    </ErrorBoundary>
  );
};

export default GameScene;
