import React from 'react';

const InterludeScreen = ({ onContinue, onPlayAnotherRound, currentRound, maxRounds }) => {
  const canPlayAnother = currentRound < maxRounds;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md z-50 pointer-events-auto">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-12 rounded-2xl shadow-2xl max-w-2xl mx-4 border-2 border-cyan-500">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-cyan-400 mb-4">
            Round {currentRound} Complete
          </h1>

          <div className="text-xl text-gray-300 space-y-3">
            <p>Everyone has shared their experiences.</p>
            {canPlayAnother ? (
              <p className="text-2xl text-white font-semibold">
                Continue questioning or proceed to voting?
              </p>
            ) : (
              <p className="text-2xl text-white font-semibold">
                Now it's time to vote.
              </p>
            )}
          </div>

          <div className="pt-8 flex gap-4 justify-center">
            {canPlayAnother && (
              <button
                onClick={onPlayAnotherRound}
                className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-2xl font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Ask Another Question
              </button>
            )}
            <button
              onClick={onContinue}
              className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-2xl font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Proceed to Voting
            </button>
          </div>

          <div className="pt-4 text-sm text-gray-500">
            {canPlayAnother ? `Round ${currentRound} of ${maxRounds}` : 'Who do you think is the human?'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterludeScreen;
