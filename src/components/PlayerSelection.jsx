import React from 'react';

const PlayerSelection = ({ models, onModelChange, onStart }) => {
  const players = [
    {
      id: 'player1',
      name: 'Marcus Sterling',
      role: 'Corporate Executive',
      description: 'Smooth-talking executive obsessed with synergy and KPIs'
    },
    {
      id: 'player2', 
      name: 'Luna Chakra',
      role: 'Yoga Instructor',
      description: 'Spiritual wellness guru who speaks in mantras and mindfulness'
    },
    {
      id: 'player3',
      name: 'Dr. Silicon',
      role: 'Tech CEO',
      description: 'Ambitious tech founder who sees everything as scalable'
    },
    {
      id: 'player4',
      name: 'xXDarkGamerXx',
      role: 'Pro Gamer',
      description: 'Elite gamer who communicates in gaming slang and memes'
    }
  ];

  const availableModels = [
    { value: 'gemini', label: 'Gemini', color: 'bg-blue-500' },
    { value: 'openai', label: 'GPT-4', color: 'bg-green-500' },
    { value: 'anthropic', label: 'Claude', color: 'bg-purple-500' }
  ];

  const handleModelChange = (playerId, model) => {
    onModelChange({ ...models, [playerId]: model });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-2 text-cyan-400">
          THE PLAYERS
        </h2>
        <p className="text-gray-400 text-center mb-8">
          You'll be playing against these AI entities. Choose their models.
        </p>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-cyan-400">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-cyan-400 mb-2">YOU</h3>
            <p className="text-gray-300">The Human Player</p>
            <p className="text-sm text-gray-500 mt-2">Prove your humanity to escape</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {players.map((player) => (
            <div key={player.id} className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-1">{player.name}</h3>
              <p className="text-cyan-400 text-sm mb-2">{player.role}</p>
              <p className="text-gray-400 text-sm mb-4">{player.description}</p>
              
              <div className="flex gap-2">
                {availableModels.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => handleModelChange(player.id, model.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      models[player.id] === model.value
                        ? `${model.color} text-white`
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors text-xl"
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelection;