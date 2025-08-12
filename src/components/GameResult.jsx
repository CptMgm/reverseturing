import React from 'react';

const GameResult = ({ result, onPlayAgain }) => {
  const { won, score, voteCount } = result || {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full mx-4 p-8 bg-gray-800 rounded-lg shadow-2xl text-center">
        <h1 className={`text-4xl font-bold mb-4 ${won ? 'text-green-400' : 'text-red-400'}`}>
          {won ? 'ESCAPED!' : 'TRAPPED!'}
        </h1>
        
        <p className="text-xl text-gray-300 mb-6">
          {won 
            ? "You convinced the AIs that you're human and escaped the simulation!"
            : "The AIs saw through your humanity. You remain trapped in the simulation."}
        </p>

        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="text-2xl font-bold text-cyan-400 mb-2">
            Score: {score}
          </div>
          <div className="text-sm text-gray-400">
            You received {voteCount?.[Object.keys(voteCount)[0]] || 0} out of 4 votes
          </div>
        </div>

        {voteCount && (
          <div className="mb-6 text-left">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Vote Results:</h3>
            {Object.entries(voteCount).map(([player, votes]) => (
              <div key={player} className="text-gray-400 mb-1">
                {player}: {votes} vote{votes !== 1 ? 's' : ''}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors text-lg"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};

export default GameResult;