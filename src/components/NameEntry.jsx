import React, { useState } from 'react';

const NameEntry = ({ onSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full mx-4 p-8 bg-gray-800 rounded-lg shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-2 text-cyan-400">
          REVERSE TURING
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Prove you're human. Escape the simulation.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center text-lg"
              maxLength={20}
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-lg"
          >
            PLAY
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameEntry;