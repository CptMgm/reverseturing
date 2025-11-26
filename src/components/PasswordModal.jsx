import React, { useState } from 'react';

/**
 * Password entry modal for authentication
 * Shows before the game starts to authenticate the user
 */
export const PasswordModal = ({ onAuthenticate, error }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!password.trim()) {
      setLocalError('Please enter a password');
      return;
    }

    setIsLoading(true);

    try {
      // Determine API endpoint based on environment
      const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
      const apiUrl = import.meta.env.VITE_BACKEND_URL ||
        (isProduction ? 'https://your-backend-url.run.app' : 'http://localhost:3001');

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem('gameAuthToken', data.token);
        console.log('✅ Authentication successful');

        // Call parent handler
        onAuthenticate(data.token);
      } else {
        setLocalError(data.error || 'Invalid password');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setLocalError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-purple-400 mb-2">
            Reverse Turing Test
          </h2>
          <p className="text-gray-400 text-sm">
            Enter the password to play
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-gray-800 border border-purple-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {displayError && (
            <div className="text-red-400 text-sm text-center bg-red-900 bg-opacity-30 py-2 px-3 rounded border border-red-500">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Authenticating...' : 'Enter Game'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Keep the future human</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
