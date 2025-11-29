import React from 'react';
import AIHarmsInfographic from './AIHarmsInfographic';

const AboutPage = ({ onBack }) => {
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
                    onClick={onBack}
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
                        <p>Given what is at stake, it is on us to understand the risks and harms we are facing.</p>
                        <p>Outlined below are 8 types of AI harm that might influence the future of humanity</p>
                        <AIHarmsInfographic />
                        <br></br>
                        <p>Find the original infographic here: <a href="https://aisfounders.com/harms" className="text-amber-200 hover:text-amber-100 underline">AI Safety Founders - Harms</a></p>
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
                                            <li><strong>AI Safety Fundamentals</strong> - bluedot.org/course for beginners</li>
                                            <li><strong>The Alignment Problem</strong> by Brian Christian - accessible intro book</li>
                                        </ul>
                                    </div>
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
                    onClick={onBack}
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
};

export default AboutPage;
