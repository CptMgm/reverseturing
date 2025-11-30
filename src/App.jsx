import React from 'react';
import { GameProvider } from './contexts/GameContext';
import GameRoom from './components/GameRoom';
import './index.css';

function App() {
  return (
    // Minor no-op comment to trigger redeploy
    <GameProvider>
      <GameRoom />
    </GameProvider>
  );
}

export default App;