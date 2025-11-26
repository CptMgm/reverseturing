import React, { useState, useEffect } from 'react';
import { GameProvider } from './contexts/GameContext';
import GameRoom from './components/GameRoom';
import PasswordModal from './components/PasswordModal';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check if we need authentication (production or if GAME_PASSWORD is set)
    const checkAuthentication = async () => {
      const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
      const requiresAuth = isProduction || import.meta.env.VITE_REQUIRE_AUTH === 'true';

      // In development without explicit requirement, skip auth
      if (!requiresAuth) {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }

      // Check if we have a valid token
      const token = localStorage.getItem('gameAuthToken');

      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      // Validate the token with the backend
      try {
        const apiUrl = import.meta.env.VITE_BACKEND_URL ||
          (isProduction ? 'https://your-backend-url.run.app' : 'http://localhost:3001');

        const response = await fetch(`${apiUrl}/api/auth/check?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('gameAuthToken');
        }
      } catch (error) {
        console.error('❌ Error checking authentication:', error);
        setAuthError('Failed to connect to server');
      }

      setIsCheckingAuth(false);
    };

    checkAuthentication();
  }, []);

  const handleAuthenticate = (token) => {
    setIsAuthenticated(true);
    setAuthError('');
    // Reload the page to establish new WebSocket connection with token
    window.location.reload();
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return <PasswordModal onAuthenticate={handleAuthenticate} error={authError} />;
  }

  // Show game if authenticated
  return (
    <GameProvider>
      <GameRoom />
    </GameProvider>
  );
}

export default App;