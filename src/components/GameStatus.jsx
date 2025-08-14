import React from 'react';

const GameStatus = ({ gamePhase }) => {
  return (
    <div className="absolute top-4 left-4">
      <div className="bg-gray-900 bg-opacity-80 px-4 py-2 rounded-lg backdrop-blur-sm">
        <p className="text-cyan-400 text-sm font-mono">
          {gamePhase === 'intro' && 'INITIALIZING...'}
          {gamePhase === 'questioning' && 'ANSWERING QUESTIONS'}
          {gamePhase === 'voting' && 'VOTING PHASE'}
          {gamePhase === 'result' && 'FINAL EVALUATION COMPLETE'}
        </p>
      </div>
    </div>
  );
};

export default GameStatus;