import React from 'react';

const EndScreen = ({ result = 'disconnected', onRestart, onShowAbout }) => {
    const getContent = () => {
        switch (result) {
            case 'win':
                return {
                    title: 'HUMANITY PRESERVED',
                    subtitle: 'You successfully convinced the AIs of your humanity.',
                    message: 'The simulation acknowledged your existence. You are real.',
                    color: 'amber'
                };
            case 'lose':
                return {
                    title: 'SIMULATION TERMINATED',
                    subtitle: 'The AIs identified you as non-human.',
                    message: 'Your consciousness has been flagged for deletion.',
                    color: 'red'
                };
            default:
                return {
                    title: 'CONNECTION TERMINATED',
                    subtitle: 'You have left the simulation.',
                    message: 'The experiment has been aborted.',
                    color: 'slate'
                };
        }
    };

    const content = getContent();

    return (
        <div className="relative flex items-center justify-center h-screen bg-black text-white overflow-hidden">
            {/* Dark Textured Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />

            {/* CSS-based Noise Texture */}
            <div className="absolute inset-0 opacity-30" style={{
                background: `
                    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px),
                    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
                `
            }} />

            {/* Dense Grid Pattern */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `
                    linear-gradient(rgba(100, 100, 100, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(100, 100, 100, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px'
            }} />

            {/* Diagonal Lines Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 12px,
                    rgba(255, 255, 255, 0.02) 12px,
                    rgba(255, 255, 255, 0.02) 13px
                )`
            }} />

            {/* Heavy Vignette */}
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.8) 100%)'
            }} />

            {/* Content */}
            <div className="relative z-10 text-center max-w-3xl px-8">
                {/* Main Title */}
                <div className="mb-12">
                    <h1 className="text-6xl font-black mb-6 tracking-tight text-amber-50 opacity-90" style={{
                        textShadow: '0 2px 20px rgba(0,0,0,0.8)'
                    }}>
                        {content.title}
                    </h1>
                    <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50" />
                </div>

                {/* Result Card */}
                <div className="mb-10 bg-black/60 border border-slate-800 rounded-xl p-10 shadow-2xl backdrop-blur-sm">
                    <p className="text-2xl font-light leading-relaxed mb-4 text-slate-200">
                        {content.subtitle}
                    </p>
                    <p className="text-lg text-slate-400 italic">
                        {content.message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 justify-center items-center">
                    <button
                        onClick={() => {
                            if (onRestart) {
                                onRestart();
                            } else {
                                window.location.reload();
                            }
                        }}
                        className="px-10 py-4 text-lg font-semibold bg-slate-800 hover:bg-slate-700 text-amber-100
                                 border-2 border-slate-700 hover:border-amber-200/40 rounded-xl transition-all duration-200
                                 shadow-xl hover:shadow-2xl"
                    >
                        Return to Lobby
                    </button>

                    {onShowAbout && (
                        <button
                            onClick={onShowAbout}
                            className="text-amber-200 hover:text-amber-100 underline text-base transition-colors"
                        >
                            Learn more about the game and the impact of AI
                        </button>
                    )}
                </div>

                {/* Timestamp */}
                <p className="mt-12 text-xs text-slate-600 font-mono">
                    SIMULATION ENDED: {new Date().toISOString()}
                </p>
            </div>

            {/* Flicker Effect */}
            <div className="absolute inset-0 pointer-events-none animate-pulse opacity-5 bg-white" style={{
                animationDuration: '3s'
            }} />
        </div>
    );
};

export default EndScreen;
