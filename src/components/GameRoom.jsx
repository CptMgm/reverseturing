import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import DailyIframe from '@daily-co/daily-js';
import VideoGrid from './VideoGrid';
import VoteControls from './VoteControls';
import PresidentOverlay from './PresidentOverlay';
import ModeSelectionModal from './ModeSelectionModal';



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
        sendTypingEvent
    } = useGame();

    // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
    const [inputText, setInputText] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const dailyRef = useRef(null);
    const callFrameRef = useRef(null);
    const typingTimeoutRef = useRef(null);

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
    if (!isConnected) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Connecting to Server...</h1>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                </div>
            </div>
        );
    }

    if (gameState.phase === 'LOBBY') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center max-w-2xl px-4">
                    <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        Reverse Turing Test
                    </h1>
                    <p className="text-xl mb-8 text-gray-300">
                        You are in a simulation. 3 AIs are trying to prove they are human.
                        You are the only real human. Convince them. Save the world.
                    </p>
                    <div className="mb-8">
                        <input
                            type="text"
                            placeholder="Enter your name..."
                            className="px-6 py-3 rounded-full bg-gray-800 border border-blue-500 text-white text-xl focus:outline-none focus:ring-2 focus:ring-blue-400 w-64 text-center"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && inputText.trim() && startGame(inputText)}
                        />
                    </div>
                    <button
                        onClick={() => startGame(inputText)}
                        disabled={!inputText.trim()}
                        className={`px-8 py-4 rounded-full text-xl font-bold transition-all transform shadow-lg ${inputText.trim()
                                ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-blue-500/50'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                    >
                        Enter Simulation
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 p-4 shadow-md flex justify-between items-center z-10">
                <div className="font-mono text-green-400">
                    STATUS: {gameState.phase}
                </div>
                {systemError && (
                    <div className="bg-red-600 text-white px-4 py-1 rounded animate-pulse font-bold">
                        ⚠️ {systemError}
                    </div>
                )}
                <div className="font-mono text-sm text-gray-400">
                    SESSION ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
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

                    {/* Custom Video Grid Overlay */}
                    <div className="relative z-10 h-full">
                        <VideoGrid
                            players={gameState.players}
                            activeSpeaker={gameState.activeSpeaker}
                            connectedPlayers={gameState.connectedPlayers}
                            waitingForUserResponse={gameState.waitingForUserResponse}
                        />
                    </div>
                </div>

                {/* Right Side: Chat & Voting - Collapsible */}
                <div className={`${isChatOpen ? 'w-80' : 'w-12'} border-l border-gray-700 flex flex-col bg-gray-800 transition-all duration-300`}>
                    {isChatOpen ? (
                        <>
                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Chat Header */}
                                <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                                    <h3 className="font-bold text-lg">Chat</h3>
                                    <button
                                        onClick={() => setIsChatOpen(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        title="Collapse chat"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Chat Messages - Scrollable */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {/* TODO: Display conversation history here */}
                                    <div className="text-gray-400 text-sm text-center">
                                        Chat messages will appear here
                                    </div>
                                </div>

                                {/* Chat Input */}
                                <div className="p-3 border-t border-gray-700">
                                    <form onSubmit={handleSend} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => handleInputChange(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg font-bold transition-colors text-sm"
                                        >
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Voting Panel - Only show during voting phase */}
                            {(gameState.phase === 'VOTING' || gameState.phase === 'PRESIDENT_VERDICT') && (
                                <div className="border-t border-gray-700 p-3 bg-gray-850">
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
