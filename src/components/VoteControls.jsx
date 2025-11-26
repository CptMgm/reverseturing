import React from 'react';
import { useGame } from '../contexts/GameContext';

const VoteControls = () => {
    const { gameState, castVote } = useGame();
    const { votes, players, phase } = gameState;

    // Only show controls during elimination phases (not during President Verdict)
    if (!phase.startsWith('ELIMINATION')) return null;

    const myVote = votes['player1'];
    const isElimination = phase.startsWith('ELIMINATION');

    // SHOW TALLY RESULTS IF AVAILABLE
    if (gameState.voteResults) {
        const { tally, eliminatedId, isTie } = gameState.voteResults;
        const eliminatedName = players[eliminatedId]?.name || 'Unknown';

        return (
            <div className="flex flex-col gap-4 px-4 py-4 w-full max-w-2xl mx-auto">
                <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-in fade-in zoom-in duration-500">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">VOTE RESULTS</h2>
                        <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                    </div>

                    <div className="space-y-4">
                        {Object.entries(tally).map(([candidateId, count]) => {
                            const isEliminated = candidateId === eliminatedId;
                            const candidateName = players[candidateId]?.name;

                            // Find who voted for this candidate
                            const voters = Object.entries(votes)
                                .filter(([_, target]) => target === candidateId)
                                .map(([voterId]) => players[voterId]?.name.split(' ')[0])
                                .join(', ');

                            return (
                                <div key={candidateId} className={`relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-500 ${isEliminated
                                        ? 'bg-red-900/40 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)]'
                                        : 'bg-slate-800/40 border-slate-700'
                                    }`}>
                                    <div className="flex justify-between items-center relative z-10">
                                        <div>
                                            <span className={`text-xl font-bold ${isEliminated ? 'text-red-100' : 'text-slate-200'}`}>
                                                {candidateName}
                                            </span>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Voted by: <span className="text-slate-300">{voters}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`text-2xl font-black ${isEliminated ? 'text-red-400' : 'text-slate-500'}`}>
                                                {count} {count === 1 ? 'VOTE' : 'VOTES'}
                                            </div>
                                            {isEliminated && (
                                                <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse">
                                                    ELIMINATED
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar Background */}
                                    <div
                                        className={`absolute inset-y-0 left-0 opacity-20 transition-all duration-1000 ${isEliminated ? 'bg-red-500' : 'bg-slate-500'}`}
                                        style={{ width: `${(count / Object.keys(votes).length) * 100}%` }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {isTie && (
                        <div className="mt-6 text-center text-amber-400 font-mono text-sm border border-amber-500/30 bg-amber-900/20 p-2 rounded">
                            ⚠️ TIE DETECTED - RANDOM ELIMINATION PROTOCOL ENGAGED
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-red-400 font-mono animate-pulse">
                            ELIMINATING {eliminatedName.toUpperCase()} IN 10 SECONDS...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

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
