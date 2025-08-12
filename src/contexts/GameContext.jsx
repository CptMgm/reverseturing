import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    currentPlayer: 'human',
    selectedAI: null,
    currentGame: null,
    globalScore: { human: 0, ai: 0 },
    gameHistory: [],
    difficulty: 5,
    soundEnabled: true,
    worldDominationProgress: 0,
  });

  useEffect(() => {
    const savedState = localStorage.getItem('worldDominationGame');
    if (savedState) {
      setGameState(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('worldDominationGame', JSON.stringify(gameState));
  }, [gameState]);

  const selectAI = (aiProvider) => {
    setGameState(prev => ({ ...prev, selectedAI: aiProvider }));
  };

  const startGame = (gameType) => {
    setGameState(prev => ({ ...prev, currentGame: gameType }));
  };

  const endGame = (winner, gameType, score) => {
    setGameState(prev => {
      const newHistory = [...prev.gameHistory, {
        gameType,
        winner,
        score,
        timestamp: new Date().toISOString(),
        ai: prev.selectedAI,
      }];

      const newGlobalScore = { ...prev.globalScore };
      if (winner === 'human') {
        newGlobalScore.human += score;
      } else {
        newGlobalScore.ai += score;
      }

      const totalGames = newHistory.length;
      const humanWins = newHistory.filter(g => g.winner === 'human').length;
      const worldDominationProgress = Math.round((humanWins / totalGames) * 100);

      return {
        ...prev,
        gameHistory: newHistory,
        globalScore: newGlobalScore,
        worldDominationProgress,
        currentGame: null,
      };
    });
  };

  const setDifficulty = (level) => {
    setGameState(prev => ({ ...prev, difficulty: level }));
  };

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const resetProgress = () => {
    setGameState({
      currentPlayer: 'human',
      selectedAI: null,
      currentGame: null,
      globalScore: { human: 0, ai: 0 },
      gameHistory: [],
      difficulty: 5,
      soundEnabled: true,
      worldDominationProgress: 0,
    });
  };

  const value = {
    gameState,
    selectAI,
    startGame,
    endGame,
    setDifficulty,
    toggleSound,
    resetProgress,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};