import React, { useState } from 'react';
import NameEntry from './components/NameEntry';
import IntroScreens from './components/IntroScreens';
import PlayerSelection from './components/PlayerSelection';
import GameScene from './components/GameScene';
import GameResult from './components/GameResult';
import { GameProvider } from './contexts/GameContext';
import './index.css';

function App() {
  const [gameState, setGameState] = useState('name-entry');
  const [playerName, setPlayerName] = useState('');
  const [selectedModels, setSelectedModels] = useState({
    player1: 'anthropic',
    player2: 'anthropic',
    player3: 'anthropic',
    player4: 'anthropic'
  });
  const [gameResult, setGameResult] = useState(null);

  const handleNameSubmit = (name) => {
    setPlayerName(name);
    setGameState('intro');
  };

  const handleIntroComplete = () => {
    setGameState('player-selection');
  };

  const handleStartGame = () => {
    setGameState('game');
  };

  const handleGameComplete = (result) => {
    setGameResult(result);
    setGameState('result');
  };

  const handlePlayAgain = () => {
    setGameState('name-entry');
    setPlayerName('');
    setGameResult(null);
  };

  return (
    <GameProvider value={{ playerName, selectedModels }}>
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {gameState === 'name-entry' && (
          <NameEntry onSubmit={handleNameSubmit} />
        )}
        {gameState === 'intro' && (
          <IntroScreens onComplete={handleIntroComplete} />
        )}
        {gameState === 'player-selection' && (
          <PlayerSelection 
            models={selectedModels}
            onModelChange={setSelectedModels}
            onStart={handleStartGame}
          />
        )}
        {gameState === 'game' && (
          <GameScene 
            playerName={playerName}
            onComplete={handleGameComplete}
          />
        )}
        {gameState === 'result' && (
          <GameResult 
            result={gameResult}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </GameProvider>
  );
}

export default App;