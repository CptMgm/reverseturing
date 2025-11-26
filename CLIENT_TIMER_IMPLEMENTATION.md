# Client-Side Timer Implementation Guide

## Problem
Server-side timers broadcast updates every second, causing lag and jitter due to network latency.

## Solution
Server sends **absolute timestamps**, client calculates remaining time **locally every frame**.

---

## Server Changes (Already Implemented ✅)

The server now sends:
1. `roundEndTime` - Absolute timestamp when round ends
2. `eliminationRevealTime` - Absolute timestamp when elimination reveal ends (10s countdown)

These are included in `gameState` and broadcast to clients.

---

## Client-Side Implementation Needed

### 1. Round Timer (90s countdown)

**Current (broken):**
```javascript
// Listening to server updates every second - laggy!
if (gameState.roundTimer) {
  setTimeRemaining(gameState.roundTimer);
}
```

**New (smooth):**
```javascript
// In your component (e.g., GameRoom.jsx)
import { useState, useEffect } from 'react';

function GameRoom() {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!gameState.roundEndTime) {
      setTimeRemaining(0);
      return;
    }

    // Update every 100ms for smooth countdown
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameState.roundEndTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100); // Update 10 times per second for smoothness

    return () => clearInterval(interval);
  }, [gameState.roundEndTime]);

  return (
    <div>
      {timeRemaining > 0 && (
        <div className="timer">
          Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}
```

---

### 2. Elimination Reveal Countdown (10s countdown)

**New implementation:**
```javascript
function EliminationReveal({ gameState }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!gameState.eliminationRevealTime) {
      return;
    }

    // Update every 100ms for smooth countdown
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameState.eliminationRevealTime - Date.now()) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.eliminationRevealTime]);

  if (!gameState.voteResults) return null;

  const eliminatedPlayer = gameState.players[gameState.voteResults.eliminatedId];

  return (
    <div className="elimination-reveal">
      <h1>ELIMINATED: {eliminatedPlayer.name}</h1>
      <div className="countdown">
        {countdown > 0 ? (
          <p>ELIMINATING {eliminatedPlayer.name.toUpperCase()} IN {countdown} SECONDS...</p>
        ) : (
          <p>ELIMINATED!</p>
        )}
      </div>
      <div className="vote-tally">
        {Object.entries(gameState.voteResults.tally).map(([playerId, votes]) => (
          <div key={playerId}>
            {gameState.players[playerId].name}: {votes} vote{votes !== 1 ? 's' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3. Remove Server Timer Listener (if exists)

**Delete this if you have it:**
```javascript
// OLD - DELETE THIS
socket.on('TIMER_UPDATE', (data) => {
  setTimeRemaining(data.remaining);
});
```

The server no longer sends `TIMER_UPDATE` messages. All timing is client-side now.

---

## Benefits

✅ **Smooth countdown** - Updates 10 times per second, no jitter
✅ **No network lag** - Calculated locally using system clock
✅ **Precise timing** - Uses absolute timestamps, immune to network delays
✅ **Lower server load** - No more broadcasting every second

---

## Testing

1. Start a game
2. Watch the round timer count down smoothly (no jumps)
3. Vote to eliminate someone
4. Watch the "ELIMINATING IN X SECONDS..." countdown smoothly
5. Timer should feel as smooth as a native countdown

---

## Notes

- Both timers use `Math.ceil()` to round up (shows "1" for 0.1s remaining)
- Update interval is 100ms (10 FPS) - smooth enough without being wasteful
- Timers auto-cleanup when `roundEndTime` or `eliminationRevealTime` becomes null
