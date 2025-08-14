import React from 'react';

const PlayerSelection = ({ models, onModelChange, onStart }) => {
  const players = [
    {
      id: 'player1',
      name: 'Elongated Muskett',
      role: 'Space Visionary',
      description: 'Space-obsessed tech billionaire focused on Mars, rockets, and making humanity multiplanetary',
      model: 'xai',
      modelLabel: 'Grok'
    },
    {
      id: 'player2', 
      name: 'Wario Amadeuss',
      role: 'AI Safety Philosopher',
      description: 'AI safety researcher concerned about alignment and existential risk',
      model: 'anthropic',
      modelLabel: 'Claude'
    },
    {
      id: 'player3',
      name: 'Domis Hassoiboi',
      role: 'Chess Philosopher',
      description: 'Chess grandmaster and deep thinker focused on consciousness and mathematics',
      model: 'google',
      modelLabel: 'Gemini'
    },
    {
      id: 'player4',
      name: 'Scan Ctrl+Altman',
      role: 'AGI Accelerationist',
      description: 'AGI accelerationist obsessed with achieving artificial general intelligence',
      model: 'openai',
      modelLabel: 'ChatGPT'
    },
  ];


  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-2 text-white">
          THE PLAYERS
        </h2>
        <p className="text-gray-400 text-center mb-8">
          You'll be playing against these AI entities, each powered by a different model.
        </p>

        <div className="bg-gray-900 rounded-lg p-8 mb-6 border-2 border-white hover:scale-105 hover:bg-gray-800 hover:border-gray-300 transition-all duration-300">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">YOU</h3>
            <p className="text-gray-200">The Human Player</p>
            <p className="text-sm text-gray-400 mt-2">Prove your humanity to escape</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {players.map((player) => (
            <div key={player.id} className="bg-gray-900 rounded-lg p-6 border border-gray-700 h-64 flex flex-col justify-between hover:scale-105 hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 cursor-pointer">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-3">{player.name}</h3>
                <p className="text-gray-300 text-sm mb-3">{player.role}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{player.description}</p>
              </div>
              
              <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {player.model === 'xai' && (
                    <div className="w-4 h-4 bg-white rounded flex items-center justify-center">
                      <span className="text-black text-xs font-bold">𝕏</span>
                    </div>
                  )}
                  {player.model === 'openai' && (
                    <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                  )}
                  {player.model === 'anthropic' && (
                    <div className="w-4 h-4 bg-orange-400 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                  )}
                  {player.model === 'google' && (
                    <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                      <div className="text-xs font-bold text-blue-600">G</div>
                    </div>
                  )}
                  <span>Powered by {player.modelLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onStart}
            className="px-12 py-4 bg-white hover:bg-gray-200 hover:scale-110 text-black font-bold rounded-lg transition-all duration-300 text-xl border-2 border-gray-400 hover:border-gray-600 shadow-lg hover:shadow-xl"
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelection;