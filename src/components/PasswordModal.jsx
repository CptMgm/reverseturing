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
        (isProduction ? 'https://reverse-turing-backend-271123520248.us-central1.run.app' : 'http://localhost:3001');

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
    <div className="fixed inset-0 bg-[#c0c0c0] flex items-center justify-center z-50 p-4">
      <div className="bg-[#c0c0c0] border-4 border-t-white border-l-white border-r-[#808080] border-b-[#808080] p-1 max-w-md w-full shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center mb-1">
          <span className="font-bold text-sm">Authentication Required</span>
          <span className="font-bold">×</span>
        </div>
        
        <div className="bg-[#c0c0c0] p-4">
          <div className="mb-4">
            <h2 className="font-bold text-black mb-2" style={{ fontFamily: 'serif' }}>
              Reverse Turing Test
            </h2>
            <p className="text-black text-sm" style={{ fontFamily: 'serif' }}>
              Enter the password to play
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-black text-sm mb-1" style={{ fontFamily: 'serif' }}>
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2 py-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white text-black"
                style={{ fontFamily: 'monospace' }}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {displayError && (
              <div className="mb-3 p-2 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
                <p className="text-red-600 text-xs" style={{ fontFamily: 'serif' }}>
                  {displayError}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-black disabled:opacity-50 active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                style={{ fontFamily: 'serif' }}
              >
                {isLoading ? 'Please wait...' : 'OK'}
              </button>
              <button
                type="button"
                className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-black"
                style={{ fontFamily: 'serif' }}
                disabled
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
