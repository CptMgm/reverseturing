import React from 'react';

const ModeSelectionModal = ({ onSelectMode, playerName }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                    Choose Communication Mode
                </h2>

                <div className="flex gap-3 mb-4">
                    <button
                        onClick={() => onSelectMode('voice')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg p-4 transition-colors border border-blue-500"
                    >
                        <div className="text-3xl mb-2">🎤</div>
                        <div className="text-white font-bold">Voice</div>
                        <div className="text-blue-200 text-xs mt-1">Recommended</div>
                    </button>

                    <button
                        onClick={() => onSelectMode('text')}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors border border-gray-600"
                    >
                        <div className="text-3xl mb-2">💬</div>
                        <div className="text-white font-bold">Text</div>
                        <div className="text-gray-400 text-xs mt-1">Chat only</div>
                    </button>
                </div>

                <p className="text-gray-400 text-xs text-center">
                    Text mode will make AIs suspicious
                </p>
            </div>
        </div>
    );
};

export default ModeSelectionModal;
