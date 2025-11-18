import React, { useState } from 'react';

const VotingPanel = ({ players, onVote }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleVote = () => {
    if (selectedPlayer) {
      onVote(selectedPlayer);
    }
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 max-w-4xl mx-auto backdrop-blur-sm">
      <h2 className="text-xl font-bold text-cyan-400 mb-3">
        Vote for who you think is the human
      </h2>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelectedPlayer(player.name)}
            className={`p-3 rounded-lg transition-all ${
              selectedPlayer === player.name
                ? 'bg-cyan-600 text-white scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="font-bold text-base">{player.name}</div>
            <div className="text-xs opacity-75">AI Player</div>
          </button>
        ))}
      </div>

      <div className="text-center mb-3">
        <button
          onClick={handleVote}
          disabled={!selectedPlayer}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
        >
          Cast Vote
        </button>
      </div>
    </div>
  );
};

export default VotingPanel;