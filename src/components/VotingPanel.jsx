import React, { useState } from 'react';

const VotingPanel = ({ players, onVote, votes }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleVote = () => {
    if (selectedPlayer) {
      onVote(selectedPlayer);
    }
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-cyan-400 text-center mb-4">
        Vote for who you think is the human
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelectedPlayer(player.name)}
            className={`p-4 rounded-lg transition-all ${
              selectedPlayer === player.name
                ? 'bg-cyan-600 text-white scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="font-bold text-lg">{player.name}</div>
            <div className="text-sm opacity-75">AI Player</div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleVote}
          disabled={!selectedPlayer}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-xl"
        >
          Cast Vote
        </button>
      </div>

      {/* Show AI votes as they come in */}
      {Object.keys(votes).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Votes Cast:</h3>
          <div className="space-y-1">
            {Object.entries(votes).map(([voter, votedFor]) => (
              <div key={voter} className="text-gray-400">
                {voter} voted for {votedFor}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingPanel;