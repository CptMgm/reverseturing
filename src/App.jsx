import React from 'react';
import { GameProvider } from './contexts/GameContext';
import GameRoom from './components/GameRoom';
import './index.css';

function App() {
  return (
    <GameProvider>
      <GameRoom />
    </GameProvider>
  );
}

export default App;