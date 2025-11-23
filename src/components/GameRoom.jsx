import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import DailyIframe from '@daily-co/daily-js';
import VideoGrid from './VideoGrid';
import VoteControls from './VoteControls';
import PresidentOverlay from './PresidentOverlay';
import ModeSelectionModal from './ModeSelectionModal';
import EndScreen from './EndScreen';



const GameRoom = () => {
    const {
        gameState,
        isConnected,
        startGame,
        sendHumanInput,
        dailyUrl,
        systemError,
        communicationMode,
        showModeSelection,
        selectCommunicationMode,
        isSpeaking,
        sendTypingEvent,
        resetGame
    } = useGame();

    // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
    const [inputText, setInputText] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [showEndScreen, setShowEndScreen] = useState(false);
    const [endScreenResult, setEndScreenResult] = useState('disconnected');
    const dailyRef = useRef(null);
    const callFrameRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const chatEndRef = useRef(null);

    // Auto-scroll chat to bottom when new messages arrive
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [gameState.conversationHistory]);

    // Check if player gets eliminated
    useEffect(() => {
        if (gameState.eliminatedPlayers?.includes('player1')) {
            console.log('💀 [GameRoom] Player eliminated - showing end screen');
            setTimeout(() => {
                setEndScreenResult('lose');
                setShowEndScreen(true);
            }, 2000); // 2 second delay to show elimination animation/message
        } else if (gameState.phase === 'LOBBY') {
            // Reset end screen when returning to lobby
            setShowEndScreen(false);
            setEndScreenResult('disconnected');
        }
    }, [gameState.eliminatedPlayers, gameState.phase]);

    useEffect(() => {
        if (dailyUrl && !callFrameRef.current) {
            console.log('📞 Joining Daily Room:', dailyUrl);
            const callFrame = DailyIframe.createFrame(dailyRef.current, {
                iframeStyle: {
                    width: '100%',
                    height: '100%',
                    border: '0',
                    borderRadius: '12px',
                },
                showLeaveButton: true,
                showFullscreenButton: true,
            });

            callFrame.join({ url: dailyUrl });
            callFrameRef.current = callFrame;
        }
    }, [dailyUrl]);

    // Handler functions
    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        sendHumanInput(inputText);
        setInputText('');
    };

    const handleInputChange = (text) => {
        setInputText(text);

        // Notify server of typing start
        if (!isTyping && text.length > 0) {
            setIsTyping(true);
            sendTypingEvent(true);
        }

        // Reset typing timeout
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTypingEvent(false);
        }, 1000);
    };

    // NOW CONDITIONAL RETURNS ARE SAFE
    if (showEndScreen) {
        return <EndScreen result={endScreenResult} onRestart={resetGame} />;
    }

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-semibold mb-8 text-amber-100">
                        Connecting to Server...
                    </h1>
                    <div className="w-16 h-16 mx-auto border-4 border-slate-700 border-t-amber-200 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (gameState.phase === 'LOBBY') {
        return (
            <div className="relative flex items-center justify-center h-screen bg-black text-white overflow-hidden">
                {/* Dark Grim Background */}
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

                <div className="relative z-10 text-center max-w-3xl px-8">
                    {/* Grim Title */}
                    <div className="mb-10">
                        <h1 className="text-7xl font-black mb-6 tracking-tight text-amber-50 opacity-90" style={{
                            textShadow: '0 2px 20px rgba(0,0,0,0.8)'
                        }}>
                            REVERSE TURING TEST
                        </h1>
                        <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50" />
                    </div>

                    {/* Subtitle Card */}
                    <div className="mb-12 bg-black/60 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
                        <p className="text-2xl font-light leading-relaxed mb-3 text-amber-50">
                            You are in a simulation.
                        </p>
                        <p className="text-lg text-slate-300 mb-2">
                            3 AIs are trying to prove they are human.
                        </p>
                        <p className="text-lg text-slate-300">
                            <span className="text-amber-200 font-semibold">You</span> are the only real human. Convince them. Save the world.
                        </p>
                        <div className="mt-6 pt-6 border-t border-slate-700/50">
                            <p className="text-sm text-slate-400 italic">
                                Note: Each AI is a separate instance. They genuinely do not know who the human is and are trying their best to identify you.
                            </p>
                        </div>
                    </div>

                    {/* Input Field */}
                    <div className="mb-10">
                        <input
                            type="text"
                            placeholder="Enter your name..."
                            className="w-full max-w-md px-8 py-4 text-xl text-center
                                     bg-black/40 border-2 border-slate-700 rounded-xl
                                     text-amber-50 placeholder-slate-600
                                     focus:outline-none focus:border-amber-200/40 focus:bg-black/60
                                     transition-all duration-200 shadow-2xl backdrop-blur-sm"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && inputText.trim()) {
                                    startGame(inputText);
                                    setInputText(''); // Clear input after starting game
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={() => {
                            startGame(inputText);
                            setInputText(''); // Clear input after starting game
                        }}
                        disabled={!inputText.trim()}
                        className={`px-12 py-4 text-xl font-semibold
                                   rounded-xl transition-all duration-200 shadow-xl backdrop-blur-sm
                                   ${inputText.trim()
                                ? 'bg-slate-800/80 hover:bg-slate-700/90 text-amber-100 border-2 border-slate-700 hover:border-amber-200/30'
                                : 'bg-black/40 text-slate-700 cursor-not-allowed border-2 border-slate-800'
                            }`}
                    >
                        Enter Simulation
                    </button>

                    {/* Hint text */}
                    <p className="mt-8 text-xs text-slate-600 font-mono">
                        Press <kbd className="px-2 py-1 bg-black/60 border border-slate-800 rounded text-slate-500">ENTER</kbd> to begin
                    </p>

                    {/* Subtle Flicker Effect */}
                    <div className="absolute inset-0 pointer-events-none animate-pulse opacity-[0.01]" style={{
                        animationDuration: '8s',
                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 60%)'
                    }} />
                </div>

                {/* Custom CSS for animations */}
                <style>{`
                    @keyframes gridMove {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(50px); }
                    }
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateX(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden relative">
            {/* Textured Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 pointer-events-none" />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
            }} />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: `linear-gradient(rgba(203, 213, 225, 0.05) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(203, 213, 225, 0.05) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }} />

            {/* Header */}
            <div className="relative z-20 bg-gray-900/90 border-b border-slate-700 p-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="font-mono text-amber-200 font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-200 rounded-full" />
                        <span className="text-sm text-slate-400">STATUS:</span>
                        <span>{gameState.phase}</span>
                    </div>

                    {/* Round Indicator */}
                    {(gameState.phase.startsWith('ROUND') || gameState.phase.startsWith('ELIMINATION')) && (
                        <div className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-amber-100 font-mono text-sm font-semibold">
                            ROUND {gameState.phase.includes('1') ? '1' : gameState.phase.includes('2') ? '2' : '3'} / 3
                        </div>
                    )}
                </div>

                {/* Timer Display */}
                {gameState.roundEndTime && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 bg-slate-800 px-6 py-2 rounded-b-lg border-x border-b border-slate-700 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${(gameState.roundEndTime - Date.now()) < 10000
                            ? 'bg-red-400'
                            : 'bg-amber-200'
                            }`} />
                        <span className="font-mono text-2xl font-bold tracking-wider text-amber-100">
                            {(() => {
                                const remaining = Math.max(0, Math.ceil((gameState.roundEndTime - Date.now()) / 1000));
                                const mins = Math.floor(remaining / 60);
                                const secs = remaining % 60;
                                return `${mins}:${secs.toString().padStart(2, '0')}`;
                            })()}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {systemError && (
                        <div className="bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm border border-red-600">
                            ⚠️ {systemError}
                        </div>
                    )}
                    <div className="font-mono text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded border border-slate-700">
                        <span className="text-slate-600">SESSION:</span> <span className="text-amber-200">{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Main Content - Google Meet Style Layout */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* Left Side: Video Grid */}
                <div className="flex-1 p-4 relative">
                    {/* Daily.co Iframe Container - Hidden but active for audio/video connection */}
                    <div className="absolute inset-0 z-0 opacity-0 pointer-events-none">
                        <div ref={dailyRef} className="w-full h-full" />
                    </div>

                    {/* Video Grid */}
                    <div className="h-full overflow-hidden relative z-10">
                        <VideoGrid
                            players={gameState.players}
                            activeSpeaker={gameState.activeSpeaker}
                            connectedPlayers={Object.keys(gameState.players)}
                            waitingForUserResponse={gameState.awaitingHumanResponse}
                            isSpeaking={isSpeaking}
                        />
                    </div>

                </div>

                {/* Right Side: Chat & Voting - Collapsible */}
                <div className={`${isChatOpen ? 'w-80' : 'w-12'} border-l border-slate-700 flex flex-col bg-gray-900/95 transition-all duration-300 relative z-10`}>
                    {/* Texture overlay for chat panel */}
                    {isChatOpen && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat'
                        }} />
                    )}
                    {isChatOpen ? (
                        <>
                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Chat Header */}
                                <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="font-semibold text-lg text-amber-100">Chat</h3>
                                    <button
                                        onClick={() => setIsChatOpen(false)}
                                        className="text-slate-400 hover:text-amber-200 transition-colors"
                                        title="Collapse chat"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Chat Messages - Scrollable (only show user messages) */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {gameState.conversationHistory && gameState.conversationHistory.length > 0 ? (
                                        <>
                                            {gameState.conversationHistory
                                                .filter(msg => msg.playerId === 'player1') // Only show user's messages
                                                .map((msg, idx) => (
                                                    <div key={idx} className="text-right">
                                                        <div className="inline-block max-w-[80%] rounded-lg p-3 text-sm bg-slate-700 text-white border border-slate-600">
                                                            <div className="font-semibold text-xs mb-1 text-amber-200">
                                                                {msg.speaker}
                                                            </div>
                                                            <div className="leading-relaxed">{msg.text}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            <div ref={chatEndRef} />
                                        </>
                                    ) : null}
                                    {/* Always show placeholder if no user messages */}
                                    {!gameState.conversationHistory?.some(msg => msg.playerId === 'player1') && (
                                        <div className="text-gray-400 text-sm text-center">
                                            Your messages will appear here
                                        </div>
                                    )}
                                </div>

                                {/* Chat Input */}
                                <div className="p-3 border-t border-slate-700">
                                    <form onSubmit={handleSend} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => handleInputChange(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white
                                                     placeholder-slate-500 focus:outline-none focus:border-amber-200/50
                                                     transition-all duration-200 text-sm"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-semibold
                                                     transition-all duration-200 text-sm text-amber-100 border border-slate-600"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Voting Panel - Only show during elimination phases */}
                            {(gameState.phase === 'ELIMINATION_1' || gameState.phase === 'ELIMINATION_2' || gameState.phase === 'PRESIDENT_VERDICT') && (
                                <div className="border-t border-slate-700 p-3">
                                    <VoteControls />
                                </div>
                            )}
                        </>
                    ) : (
                        /* Collapsed State - Just the toggle button */
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="w-full h-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                            title="Open chat"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Call Controls */}
            <div className="relative z-20 bg-gray-900/95 border-t border-slate-700 px-6 py-4 flex justify-center items-center gap-5 shadow-xl">
                {/* Mute Button */}
                <button
                    disabled={communicationMode === 'text'}
                    className={`p-4 rounded-full transition-all duration-200 shadow-md ${communicationMode === 'text'
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed border-2 border-slate-700'
                        : 'bg-slate-700 hover:bg-red-700 text-white border-2 border-slate-600 hover:border-red-600'
                        }`}
                    title={communicationMode === 'text' ? 'Text mode only' : 'Mute (not implemented)'}
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Hang Up Button */}
                <button
                    onClick={() => {
                        // Play hang up sound
                        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(e => { });
                        // Show end screen after brief delay
                        setTimeout(() => {
                            setEndScreenResult('disconnected');
                            setShowEndScreen(true);
                        }, 300);
                    }}
                    className="p-5 rounded-full bg-red-700 hover:bg-red-600 text-white transition-all duration-200 border-2 border-red-600 shadow-lg hover:shadow-xl"
                    title="Hang up and leave"
                >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                </button>
            </div>

            {/* President Overlay */}
            {gameState.phase === 'PRESIDENT_INTRO' && !showModeSelection && <PresidentOverlay />}

            {/* Mode Selection Modal */}
            {showModeSelection && (
                <ModeSelectionModal
                    onSelectMode={selectCommunicationMode}
                    playerName={gameState.players?.player1?.name || 'Player'}
                />
            )}
        </div>
    );
};

export default GameRoom;
