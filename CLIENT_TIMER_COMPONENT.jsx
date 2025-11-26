/**
 * Client-Side Timer Components
 *
 * Copy these into your React components to get smooth, lag-free timers
 * that update 10 times per second using local timestamps from the server.
 */

import { useState, useEffect } from 'react';

/**
 * Round Timer - Shows remaining time in a round
 *
 * Usage:
 *   <RoundTimer roundEndTime={gameState.roundEndTime} />
 */
export function RoundTimer({ roundEndTime }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!roundEndTime) {
      setTimeRemaining(0);
      return;
    }

    // Update every 100ms for smooth countdown (10 FPS)
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((roundEndTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [roundEndTime]);

  if (timeRemaining === 0) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="round-timer">
      <div className="timer-label">Time Remaining</div>
      <div className="timer-value">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
}

/**
 * Elimination Countdown - Shows countdown during elimination reveal
 *
 * Usage:
 *   <EliminationCountdown
 *     eliminationRevealTime={gameState.eliminationRevealTime}
 *     voteResults={gameState.voteResults}
 *     players={gameState.players}
 *   />
 */
export function EliminationCountdown({ eliminationRevealTime, voteResults, players }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!eliminationRevealTime) {
      return;
    }

    // Update every 100ms for smooth countdown
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((eliminationRevealTime - Date.now()) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [eliminationRevealTime]);

  if (!voteResults || !voteResults.eliminatedId) return null;

  const eliminatedPlayer = players[voteResults.eliminatedId];
  if (!eliminatedPlayer) return null;

  return (
    <div className="elimination-reveal-overlay">
      <div className="elimination-header">
        <h1>VOTING RESULTS</h1>
      </div>

      <div className="vote-tally">
        {Object.entries(voteResults.tally)
          .sort((a, b) => b[1] - a[1]) // Sort by vote count descending
          .map(([playerId, votes]) => (
            <div
              key={playerId}
              className={`vote-row ${playerId === voteResults.eliminatedId ? 'eliminated' : ''}`}
            >
              <span className="player-name">{players[playerId]?.name}</span>
              <span className="vote-count">{votes} vote{votes !== 1 ? 's' : ''}</span>
            </div>
          ))}
      </div>

      <div className="elimination-announcement">
        <h2>ELIMINATED: {eliminatedPlayer.name.toUpperCase()}</h2>
      </div>

      <div className="countdown-timer">
        {countdown > 0 ? (
          <>
            <div className="countdown-label">ELIMINATING IN</div>
            <div className="countdown-number">{countdown}</div>
            <div className="countdown-label">SECONDS...</div>
          </>
        ) : (
          <div className="countdown-label">ELIMINATED!</div>
        )}
      </div>
    </div>
  );
}

/**
 * Example CSS for styling (add to your CSS file)
 */
const exampleCSS = `
.round-timer {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 15px 25px;
  border-radius: 10px;
  font-family: monospace;
}

.timer-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.timer-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.elimination-reveal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
  padding: 40px;
}

.elimination-header h1 {
  font-size: 48px;
  margin-bottom: 40px;
  text-transform: uppercase;
  letter-spacing: 4px;
}

.vote-tally {
  margin-bottom: 40px;
  min-width: 400px;
}

.vote-row {
  display: flex;
  justify-content: space-between;
  padding: 15px 30px;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 24px;
}

.vote-row.eliminated {
  background: rgba(255, 0, 0, 0.3);
  border: 2px solid #ff0000;
}

.elimination-announcement h2 {
  font-size: 56px;
  color: #ff0000;
  margin: 40px 0;
  text-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
}

.countdown-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.countdown-label {
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #888;
}

.countdown-number {
  font-size: 120px;
  font-weight: bold;
  color: #ff0000;
  text-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
`;

/**
 * HOW TO USE:
 *
 * 1. Import these components in your GameRoom.jsx:
 *    import { RoundTimer, EliminationCountdown } from './ClientTimerComponents';
 *
 * 2. Add them to your JSX:
 *    <RoundTimer roundEndTime={gameState.roundEndTime} />
 *    <EliminationCountdown
 *      eliminationRevealTime={gameState.eliminationRevealTime}
 *      voteResults={gameState.voteResults}
 *      players={gameState.players}
 *    />
 *
 * 3. Remove any old timer update listeners from WebSocket
 *
 * 4. The timers will now update smoothly at 10 FPS with no network lag!
 */
