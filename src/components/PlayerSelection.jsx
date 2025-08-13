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

  const getModelColor = (model) => {
    switch (model) {
      case 'xai': return 'bg-red-600';
      case 'anthropic': return 'bg-purple-600';
      case 'google': return 'bg-blue-600';
      case 'openai': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-2 text-primary">
          THE PLAYERS
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          You'll be playing against these AI entities, each powered by a different model.
        </p>

        <div className="bg-card rounded-lg p-6 mb-6 border-2 border-primary">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">YOU</h3>
            <p className="text-foreground">The Human Player</p>
            <p className="text-sm text-muted-foreground mt-2">Prove your humanity to escape</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {players.map((player) => (
            <div key={player.id} className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-1">{player.name}</h3>
              <p className="text-accent text-sm mb-2">{player.role}</p>
              <p className="text-muted-foreground text-sm mb-4">{player.description}</p>
              
              <div className="flex justify-center">
                <div className={`px-4 py-2 rounded-lg font-semibold text-white ${getModelColor(player.model)}`}>
                  Powered by {player.modelLabel}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors text-xl border-2 border-accent"
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelection;