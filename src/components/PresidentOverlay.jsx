import React from 'react';

const PresidentOverlay = () => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
            <div className="text-center max-w-4xl px-8">
                <div className="mb-8">
                    <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full border-4 border-red-600 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                        <span className="text-6xl">🦅</span>
                    </div>
                    <h2 className="text-5xl font-bold text-red-500 mb-2 tracking-wider uppercase">
                        President Dorkesh Cartel
                    </h2>
                    <div className="h-1 w-32 bg-red-600 mx-auto"></div>
                </div>

                <div className="text-2xl text-gray-300 leading-relaxed font-serif italic">
                    <p className="animate-pulse">
                        "Establishing secure connection... Transmitting mission parameters..."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PresidentOverlay;
