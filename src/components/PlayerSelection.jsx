import React from 'react';

const PlayerSelection = ({ models, onModelChange, onStart }) => {
  const players = [
    {
      id: 'player1',
      name: 'Elongated Musk',
      role: 'Space Visionary',
      description: 'Space-obsessed tech billionaire focused on Mars and sustainable energy'
    },
    {
      id: 'player2', 
      name: 'The Zucc',
      role: 'Tech CEO',
      description: 'Tech startup founder obsessed with scaling and disruption'
    },
    {
      id: 'player3',
      name: 'Domis Hassoiboi',
      role: 'Chess Philosopher',
      description: 'Chess grandmaster and deep thinker focused on consciousness and mathematics'
    },
    {
      id: 'player4',
      name: 'Spam Alpman',
      role: 'Crypto Trader',
      description: 'Crypto trading enthusiast obsessed with diamond hands and moon missions'
    },
    {
      id: 'player5',
      name: 'Wario Amadeuss',
      role: 'Classical Composer',
      description: 'Passionate classical music composer with dramatic artistic flair'
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-2 text-primary">
          THE PLAYERS
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          You'll be playing against these AI entities. Choose their models.
        </p>

        <div className="bg-card rounded-lg p-6 mb-6 border-2 border-primary">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">YOU</h3>
            <p className="text-foreground">The Human Player</p>
            <p className="text-sm text-muted-foreground mt-2">Prove your humanity to escape</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {players.map((player) => (
            <div key={player.id} className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-1">{player.name}</h3>
              <p className="text-accent text-sm mb-2">{player.role}</p>
              <p className="text-muted-foreground text-sm mb-4">{player.description}</p>
              
              <div className="flex gap-2 flex-wrap">
                {availableModels.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => handleModelChange(player.id, model.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      models[player.id] === model.value
                        ? model.value === 'gemini' ? 'bg-blue-600 text-white' :
                          model.value === 'openai' ? 'bg-green-600 text-white' :
                          'bg-purple-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-secondary'
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