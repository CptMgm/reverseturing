import React from 'react';
import { useGame } from '../contexts/GameContext';

const VoteControls = () => {
    const { gameState, castVote } = useGame();
    const { votes, players, phase } = gameState;

    // Only show controls during elimination phases (not during President Verdict)
    if (!phase.startsWith('ELIMINATION')) return null;

    const myVote = votes['player1'];
    const isElimination = phase.startsWith('ELIMINATION');

    return (
        <div className="flex flex-col gap-3 px-2 sm:px-4 py-2 w-full">
            {/* Voting Buttons Panel */}
            <div className="flex flex-col bg-black/60 backdrop-blur-xl p-4 rounded-xl border border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.3)] gap-4">
                <div className="flex flex-col text-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 font-bold font-mono text-lg animate-pulse">
                        ⚠️ ELIMINATION PROTOCOL
                    </span>
                    <span className="text-gray-400 text-xs uppercase tracking-wider mt-1">
                        Vote to eliminate a bot
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(players).map(([id, player]) => {
                        if (id === 'player1' || id === 'moderator') return null; // Can't vote for self or moderator

                        // Don't show eliminated players
                        if (gameState.eliminatedPlayers?.includes(id)) return null;

                        const isVoted = myVote === id;

                        return (
                            <button
                                key={id}
                                onClick={() => castVote(id)}
                                className={`px-4 py-3 rounded-lg font-bold text-sm transition-all transform hover:scale-105 ${isVoted
                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.8)] border-2 border-pink-400'
                                    : 'bg-slate-900/80 text-gray-300 hover:bg-gradient-to-r hover:from-pink-900/50 hover:to-purple-900/50 hover:text-white border-2 border-purple-500/30 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                                    }`}
                            >
                                {isVoted ? '✓ ' : ''}{player.name.split(' ')[0]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Vote Status Indicators */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                {Object.entries(players).map(([id, player]) => {
                    if (id === 'player1' || id === 'moderator') return null;
                    if (gameState.eliminatedPlayers?.includes(id)) return null;

                    const votedForId = votes[id];
                    const hasVoted = !!votedForId;

                    return (
                        <div key={id} className={`flex items-center gap-1.5 sm:gap-2 text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border backdrop-blur-sm ${hasVoted
                            ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-900/50 border-purple-500/30 text-gray-400'}`}>
                            <span className="font-bold">{player.name.split(' ')[0]}</span>
                            <span className="hidden sm:inline">{hasVoted ? '✓ voted' : '• thinking...'}</span>
                            <span className="sm:hidden">{hasVoted ? '✓' : '•'}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VoteControls;
