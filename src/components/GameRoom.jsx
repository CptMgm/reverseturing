import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import DailyIframe from '@daily-co/daily-js';
import VideoGrid from './VideoGrid';
import VoteControls from './VoteControls';
import PresidentOverlay from './PresidentOverlay';
import ModeSelectionModal from './ModeSelectionModal';
import EndScreen from './EndScreen';
import AIHarmsInfographic from './AIHarmsInfographic';



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
    const [roundOverlay, setRoundOverlay] = useState(null); // { title: 'ROUND 1', subtitle: 'Identify the Human' }
    const [userAvatar, setUserAvatar] = useState(null);
    const [showAbout, setShowAbout] = useState(false);
    const dailyRef = useRef(null);
    const callFrameRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const chatEndRef = useRef(null);
    const prevPhaseRef = useRef(gameState.phase);

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

        // ROUND TRANSITION OVERLAYS
        if (gameState.phase !== prevPhaseRef.current) {
            // Show Round 1 overlay when entering ROUND_1
            if (gameState.phase === 'ROUND_1') {
                setRoundOverlay({ title: 'ROUND 1', subtitle: '4 Players Remain • 90 Seconds' });
                setTimeout(() => setRoundOverlay(null), 5000); // 5s overlay
            } else if (gameState.phase === 'ROUND_2') {
                setRoundOverlay({ title: 'ROUND 2', subtitle: '3 Players Remain • 90 Seconds' });
                setTimeout(() => setRoundOverlay(null), 4000);
            } else if (gameState.phase === 'ROUND_3') {
                setRoundOverlay({ title: 'FINAL ROUND', subtitle: 'The President Returns' });
                setTimeout(() => setRoundOverlay(null), 4000);
            }
            prevPhaseRef.current = gameState.phase;
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


    if (showAbout) {
        return (
            <div className="relative min-h-screen bg-black text-white overflow-x-hidden overflow-y-auto">
                {/* Dark Grim Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />

                {/* ASCII Art Background - Large Scale */}
                <div className="absolute inset-0 opacity-[0.03] font-mono text-xs leading-none pointer-events-none overflow-hidden select-none whitespace-pre" style={{
                    textShadow: '0 0 2px rgba(255,255,255,0.1)'
                }}>
                    {`
    ██████╗ ███████╗██╗   ██╗███████╗██████╗ ███████╗███████╗    ████████╗██╗   ██╗██████╗ ██╗███╗   ██╗ ██████╗
    ██╔══██╗██╔════╝██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝    ╚══██╔══╝██║   ██║██╔══██╗██║████╗  ██║██╔════╝
    ██████╔╝█████╗  ██║   ██║█████╗  ██████╔╝███████╗█████╗         ██║   ██║   ██║██████╔╝██║██╔██╗ ██║██║  ███╗
    ██╔══██╗██╔══╝  ╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██╔══╝         ██║   ██║   ██║██╔══██╗██║██║╚██╗██║██║   ██║
    ██║  ██║███████╗ ╚████╔╝ ███████╗██║  ██║███████║███████╗       ██║   ╚██████╔╝██║  ██║██║██║ ╚████║╚██████╔╝
    ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝       ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝

         ████████╗███████╗███████╗████████╗    ╔═══════════════════════════════════════════════════════════╗
         ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ║  HUMAN vs AI • REAL-TIME CONVERSATION • PROVE YOUR WORTH ║
            ██║   █████╗  ███████╗   ██║       ╚═══════════════════════════════════════════════════════════╝
            ██║   ██╔══╝  ╚════██║   ██║       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
            ██║   ███████╗███████║   ██║       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
            ╚═╝   ╚══════╝╚══════╝   ╚═╝       ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒

    ╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
    ║  01001000 01010101 01001101 01000001 01001110  •  01000001 01001001  •  01010100 01000101 01010011  ║
    ╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    `}
                </div>

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

                {/* Heavy Vignette */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.8) 100%)'
                }} />

                <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-16">
                    {/* Back Button - Top */}
                    <button
                        onClick={() => setShowAbout(false)}
                        className="mb-8 text-amber-200 hover:text-amber-100 transition-colors text-sm"
                    >
                        ← Back to Lobby
                    </button>

                    {/* Title */}
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl sm:text-5xl font-black mb-4 text-amber-50 opacity-90" style={{
                            textShadow: '0 2px 20px rgba(0,0,0,0.8)'
                        }}>
                            About This Game
                        </h1>
                        <div className="h-px w-48 sm:w-64 mx-auto bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50" />
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8 text-slate-300">
                        <section className="space-y-4 leading-relaxed text-lg">
                            <p>A few companies are racing to build AI smarter than humans.</p>
                            <p>We see lines on a graph. We see numbers reported by magazines.</p>
                            <p className="italic">We rarely feel it. We rarely feel what it means to have your humanness matched by a machine.</p>
                            <p>I want people to know what's at stake when we talk about handing our future over to AI. Not from a conceptual, rational position, but from an emotional, lived experience perspective.</p>
                            <p>In <span className="font-semibold">Reverse Turing Test</span>, you compete with AIs the way we're all poised to do in the future. You join a call with 3 seperate AIs. Everyone claims they're the real human. You have to convince them it's you.</p>
                        </section>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-12" />

                        {/* The Risks Section */}
                        <section>
                            <h2 className="text-3xl font-bold text-amber-200 mb-6">The Risks We're Racing Toward</h2>
                            <p>Given what is at stake. It is on us to understand the risks and harms we are facing. Outlined below are 8 types of AI harm that might influence the future of humanity</p>
                            <AIHarmsInfographic />
                            <br></br>
                            <p>The original infographic was first published here: <a href="https://aisfounders.com/harms" className="text-amber-200 hover:text-amber-100 underline">AI Safety Founders - Harms</a></p>
                            <p>Also read more about <a href="https://keepthefuturehuman.ai" className="text-amber-200 hover:text-amber-100 underline">Keep The Future Human</a></p>
                            
                        </section>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-12" />

                        {/* FAQ Section */}
                        <section>
                            <h2 className="text-3xl font-bold text-amber-200 mb-6">FAQ</h2>
                            <div className="space-y-4">
                                <details className="bg-black/40 border border-slate-700 rounded-lg p-6 group">
                                    <summary className="font-bold text-amber-100 cursor-pointer list-none flex items-center justify-between">
                                        <span>How do I play?</span>
                                        <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="mt-4 space-y-3 text-slate-300">
                                        <p>The game has three rounds:</p>
                                        <p><strong className="text-amber-100">Round 1 - Questions:</strong> The Moderator (Dwarkesh Patel) asks each player a question about being human. You and three AI characters take turns answering.</p>
                                        <p><strong className="text-amber-100">Round 2 - Discussion:</strong> Free-form debate. Anyone can speak. AIs will ask you questions and respond to each other.</p>
                                        <p><strong className="text-amber-100">Round 3 - Voting:</strong> Everyone votes on who they think is the real human. Most votes wins.</p>
                                        <p className="italic">Each AI character is powered by a separate instance of Gemini 2.0 Flash with distinct personalities and instructions. They don't know you're the human—they genuinely believe they might be.</p>
                                    </div>
                                </details>

                                <details className="bg-black/40 border border-slate-700 rounded-lg p-6 group">
                                    <summary className="font-bold text-amber-100 cursor-pointer list-none flex items-center justify-between">
                                        <span>How did you build this?</span>
                                        <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="mt-4 space-y-3 text-slate-300">
                                        <p>The game runs on:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4">
                                            <li><strong className="text-amber-100">Frontend:</strong> React + Vite + Tailwind CSS</li>
                                            <li><strong className="text-amber-100">Backend:</strong> Node.js + Express + WebSocket</li>
                                            <li><strong className="text-amber-100">AI:</strong> Google Gemini API (gemini-2.0-flash) - each character is a separate API instance</li>
                                            <li><strong className="text-amber-100">Voice:</strong> ElevenLabs TTS for AI speech</li>
                                        </ul>
                                        <p className="mt-4">Technical approach:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-4">
                                            <li>Message queue system prevents simultaneous AI responses</li>
                                            <li>Each AI maintains conversation context through a rolling message window</li>
                                            <li>Turn management detects when you're being asked a question directly</li>
                                            <li>All voices have telephone audio processing for consistent quality</li>
                                        </ul>
                                        <p className="mt-4 italic">Full code is open source on GitHub.</p>
                                    </div>
                                </details>

                                <details className="bg-black/40 border border-slate-700 rounded-lg p-6 group">
                                    <summary className="font-bold text-amber-100 cursor-pointer list-none flex items-center justify-between">
                                        <span>Where can I learn more about AI safety?</span>
                                        <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="mt-4 space-y-4 text-slate-300">
                                        <div>
                                            <p className="font-semibold text-amber-100 mb-2">Essays & Resources:</p>
                                            <ul className="list-disc list-inside space-y-1 ml-4">
                                                <li><strong>Keep The Future Human</strong> by Anthony Aguirre - the essay that inspired this game</li>
                                                <li><strong>My post on AI harms</strong> - catalog of risks we're already seeing</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-amber-100 mb-2">Creators to follow:</p>
                                            <ul className="list-disc list-inside space-y-1 ml-4">
                                                <li><strong>Rob Miles</strong> - Clear explanations of AI alignment problems</li>
                                                <li><strong>Rational Animations</strong> - Animated deep dives on AI risk</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-amber-100 mb-2">Get involved:</p>
                                            <ul className="list-disc list-inside space-y-1 ml-4">
                                                <li><strong>AI Safety Founders</strong> - Community of 300+ people building in AI safety (I'm a cofounder)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </details>

                                <details className="bg-black/40 border border-slate-700 rounded-lg p-6 group">
                                    <summary className="font-bold text-amber-100 cursor-pointer list-none flex items-center justify-between">
                                        <span>Can I share this game?</span>
                                        <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="mt-4 space-y-2 text-slate-300">
                                        <p>Yes! Please share it. The whole point is getting people to experience current AI capabilities firsthand.</p>
                                        <p><strong className="text-amber-100">Link:</strong> <a href="https://beepbooptest.com" className="text-amber-200 hover:text-amber-100 underline">beepbooptest.com</a></p>
                                    </div>
                                </details>
                            </div>
                        </section>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-12" />

                        {/* Contact Section */}
                        <section>
                            <h2 className="text-3xl font-bold text-amber-200 mb-6">Contact</h2>
                            <div className="space-y-2 text-slate-300">
                                <p>Questions, feedback, or want to discuss AI safety?</p>
                                <p><strong className="text-amber-100">Email:</strong> <a href="mailto:contact@beepbooptest.com" className="text-amber-200 hover:text-amber-100 underline">contact@beepbooptest.com</a></p>
                                <p><strong className="text-amber-100">LinkedIn:</strong> <a href="https://linkedin.com/in/finn-metz" className="text-amber-200 hover:text-amber-100 underline">Finn Metz</a></p>
                            </div>
                        </section>
                    </div>

                    {/* Back Button - Bottom */}
                    <button
                        onClick={() => setShowAbout(false)}
                        className="mt-16 w-full sm:w-auto px-12 py-4 text-lg font-semibold bg-slate-800/80 hover:bg-slate-700/90 text-amber-100 border-2 border-slate-700 hover:border-amber-200/30 rounded-xl transition-all duration-200 shadow-xl backdrop-blur-sm"
                    >
                        ← Back to Lobby
                    </button>

                    {/* Subtle Flicker Effect */}
                    <div className="absolute inset-0 pointer-events-none animate-pulse opacity-[0.01]" style={{
                        animationDuration: '8s',
                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 60%)'
                    }} />
                </div>
            </div>
        );
    }

    if (gameState.phase === 'LOBBY') {

        return (
            <div className="relative flex items-center justify-center min-h-screen h-screen bg-black text-white overflow-x-hidden overflow-y-auto">
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

                <div className="relative z-10 text-center w-full max-w-3xl px-4 sm:px-6 md:px-8 py-8 pt-32">
                    {/* Grim Title */}
                    <div className="mb-6 md:mb-8">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 md:mb-4 text-amber-50 opacity-90 leading-tight flex flex-wrap justify-center gap-x-3" style={{
                            textShadow: '0 2px 20px rgba(0,0,0,0.8)'
                        }}>
                            {['REVERSE', 'TURING', 'TEST'].map((word, wordIndex) => (
                                <span key={wordIndex} className="inline-flex">
                                    {word.split('').map((char, charIndex) => (
                                        <span
                                            key={charIndex}
                                            className="inline-block transition-all duration-200 hover:scale-125 hover:text-amber-200"
                                        >
                                            {char}
                                        </span>
                                    ))}
                                </span>
                            ))}
                        </h1>
                        <div className="h-px w-48 sm:w-64 mx-auto bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50" />
                    </div>

                    {/* Subtitle Card */}
                    <div className="mb-8 md:mb-12 bg-black/60 border border-slate-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-sm">
                        <p className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed mb-3 text-amber-50">
                            You are in a simulation.
                        </p>
                        <p className="text-base sm:text-lg text-slate-300 mb-2">
                            You are joining a phone call with 3 AIs trying to prove they are human.
                        </p>
                        <p className="text-base sm:text-lg text-slate-300">
                            <span className="text-amber-200 font-semibold">Convince them that you are the only real human and keep the matrix from collapsing!</span>
                        </p>
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700/50">
                            <p className="text-xs sm:text-sm text-slate-400 italic">
                                Each player in this call is a separate AI not knowing who the real human is. They are instructed to be skeptical and figure out the truth.
                            </p>
                        </div>
                    </div>

                    {/* About Link */}
                    <div className="mb-8 flex justify-center">
                        <button
                            onClick={() => setShowAbout(true)}
                            className="text-amber-200 hover:text-amber-100 underline text-base sm:text-lg transition-colors"
                        >
                            About the Game
                        </button>
                    </div>

                    {/* Avatar Selection */}
                    <div className="mb-8">
                        <p className="text-center text-sm text-slate-400 mb-4">Choose your avatar</p>
                        <div className="flex justify-center gap-6">
                            <div
                                onClick={() => setUserAvatar('/images/characters/User/User_Male.jpg')}
                                className={`cursor-pointer transition-all ${userAvatar === '/images/characters/User/User_Male.jpg'
                                        ? 'ring-4 ring-amber-200 scale-110'
                                        : 'ring-2 ring-slate-700 hover:ring-slate-500'
                                    } rounded-full`}
                            >
                                <img
                                    src="/images/characters/User/User_Male.jpg"
                                    alt="Male avatar"
                                    className="w-20 h-20 rounded-full object-cover"
                                    style={{ objectPosition: '58% 58%' }}
                                />
                            </div>
                            <div
                                onClick={() => setUserAvatar('/images/characters/User/User_Female.jpg')}
                                className={`cursor-pointer transition-all ${userAvatar === '/images/characters/User/User_Female.jpg'
                                        ? 'ring-4 ring-amber-200 scale-110'
                                        : 'ring-2 ring-slate-700 hover:ring-slate-500'
                                    } rounded-full`}
                            >
                                <img
                                    src="/images/characters/User/User_Female.jpg"
                                    alt="Female avatar"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Input Field */}
                    <div className="mb-8 md:mb-10">
                        <input
                            type="text"
                            placeholder="Enter your name..."
                            className="w-full max-w-md px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl text-center
                                     bg-black/40 border-2 border-slate-700 rounded-xl
                                     text-amber-50 placeholder-slate-600
                                     focus:outline-none focus:border-amber-200/40 focus:bg-black/60
                                     transition-all duration-200 shadow-2xl backdrop-blur-sm"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && inputText.trim()) {
                                    startGame(inputText);
                                    setInputText('');
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={() => {
                            startGame(inputText);
                            setInputText('');
                        }}
                        disabled={!inputText.trim() || !userAvatar}
                        className={`px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-semibold
                                   rounded-xl transition-all duration-200 shadow-xl backdrop-blur-sm
                                   ${(inputText.trim() && userAvatar)
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
                            connectedPlayers={gameState.connectedPlayers || []}
                            waitingForUserResponse={gameState.awaitingHumanResponse}
                            isSpeaking={isSpeaking}
                            userAvatar={userAvatar}
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
                                    <form onSubmit={handleSend} className="flex gap-2 items-center w-full">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => handleInputChange(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white
                                                     placeholder-slate-500 focus:outline-none focus:border-amber-200/50
                                                     transition-all duration-200 text-sm min-w-0"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold
                                                     transition-all duration-200 text-sm text-amber-100 border border-slate-600 whitespace-nowrap shadow-lg"
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

            {/* Round Transition Overlay */}
            {roundOverlay && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="text-center">
                        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 mb-4 tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-in zoom-in duration-700">
                            {roundOverlay.title}
                        </h1>
                        <p className="text-2xl text-slate-300 font-light tracking-widest uppercase animate-in slide-in-from-bottom-10 duration-700 delay-200">
                            {roundOverlay.subtitle}
                        </p>
                    </div>
                </div>
            )}

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
