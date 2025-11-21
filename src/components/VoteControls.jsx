import React from 'react';
import { useGame } from '../contexts/GameContext';

const VoteControls = () => {
    const { gameState, callPresident, castVote } = useGame();
    const { votes, players, consensus, activeSpeaker } = gameState;

    // Calculate vote counts
    const voteCounts = {};
    Object.values(votes).forEach(votedFor => {
        if (votedFor) {
            voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
        }
    });

    const myVote = votes['player1'];

    return (
        <div className="flex flex-col gap-4 px-4">
            {/* Voting Buttons Panel */}
            <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                <span className="text-gray-400 font-mono text-sm mr-4">CAST YOUR VOTE:</span>
                <div className="flex gap-2">
                    {Object.entries(players).map(([id, player]) => {
                        if (id === 'player1') return null; // Can't vote for self

                        const isVoted = myVote === id;

                        return (
                            <button
                                key={id}
                                onClick={() => castVote(id)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isVoted
                                        ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                    }`}
                            >
                                {isVoted ? 'VOTED: ' : 'VOTE '} {player.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    {/* Vote Status Indicators */}
                    {Object.entries(players).map(([id, player]) => {
                        if (id === 'player1') return null;

                        const votedForId = votes[id];
                        const votedForName = votedForId ? players[votedForId]?.name : '???';

                        return (
                            <div key={id} className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 px-3 py-1.5 rounded-lg">
                                <span className="font-bold text-gray-300">{player.name}</span>
                                <span>voted for</span>
                                <span className={`font-bold ${votedForId ? 'text-red-400' : 'text-gray-600'}`}>
                                    {votedForId ? votedForName : '...'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Call President Button */}
                <button
                    onClick={callPresident}
                    disabled={!consensus}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${consensus
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {consensus ? '📞 CALL PRESIDENT' : 'WAITING FOR CONSENSUS...'}
                </button>
            </div>
        </div>
    );
};

export default VoteControls;
