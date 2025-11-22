# Current Issues & Status

## ✅ FIXED ISSUES

### 1. Voting Panel Not Appearing ✅
**Status**: FIXED
**Problem**: Timer ran out but voting panel didn't show
**Root Cause**: GameRoom.jsx checked for phase `'VOTING'` but backend uses `'ELIMINATION_1'`/`'ELIMINATION_2'`
**Fix Applied**: Updated GameRoom.jsx:267 to check correct phase names

### 2. Pronoun "You" → Player Name Replacement ✅
**Status**: FIXED
**Problem**: AIs saying "chris sound like..." instead of "YOU sound like..."
**Root Cause**: geminiLiveService.js had faulty post-processing replacing "You" with player name
**Fix Applied**: Removed replacement code (lines 113-123) from geminiLiveService.js

### 3. AI Auto-Voting System ✅
**Status**: IMPLEMENTED & WORKING
**Evidence**: Screenshot shows all 3 AIs voted (green "has voted" indicators)
**Implementation**:
- `server.js:362-472` - AI voting callback using Gemini API
- Each AI analyzes last 15 messages and votes intelligently
- Votes staggered by 2-5 seconds for natural feel
- Fallback to random if API fails

---

## ⚠️ CURRENT ISSUES

### Issue #1: "You," Phantom Player Addressing
**Severity**: Medium
**Description**: AIs say things like "You, what do YOU think?" as if addressing a silent 4th player

**Examples from logs**:
```
Scan: "You, any thoughts? You're being awfully quiet."
Scan: "You, are you gonna let Chirs get away with this?"
Domis: "You, perhaps you could enlighten us..."
Wario: "YOU, what's YOURS?"
```

**Root Cause**:
- There are 4 total players in the game (player1=human, player2=Wario, player3=Domis, player4=Scan)
- When one AI hasn't spoken yet or has been quiet, others try to address them
- Since they don't know the specific player ID, they default to "You,"
- This happens especially when Wario is slow to respond

**Potential Fixes**:
1. **Option A**: Update prompts to list all 4 player names explicitly so AIs always use names
2. **Option B**: Accept this as semi-natural (like saying "Hey you, quiet one!")
3. **Option C**: Improve turn-taking logic so AIs know WHO hasn't spoken yet

**Recommended**: Option A - Add explicit player roster to each AI's prompt

---

### Issue #2: Missing 10-Second Elimination Delay
**Severity**: High
**Status**: NOT IMPLEMENTED
**Requirement**: After votes resolve, wait 10 seconds before eliminating player

**Current Behavior**:
- Votes cast → `resolveElimination()` called after 1 second → immediate elimination
- No time for eliminated player to react
- No announcement of results

**Required Changes**:
1. After `resolveElimination()` determines who's eliminated, WAIT 10 seconds
2. During this time, show vote tally to all players
3. Optionally: Let eliminated player speak one last time
4. Then call `eliminatePlayer()` with sound effect

**Code Location**: `moderatorController.js:491-544`

---

### Issue #3: No Elimination Sound Effect
**Severity**: Medium
**Status**: NOT IMPLEMENTED
**Requirement**: Play call drop-off sound when player is eliminated (similar to Google/Skype drop sound)

**Current Behavior**: Player just silently disconnects

**Required**:
1. Find/create drop-off sound effect file
2. Play it when `eliminatePlayer()` is called
3. Add to frontend audio playback system

---

### Issue #4: No Vote Tally Display
**Severity**: Medium
**Status**: VOTING UI EXISTS, but no results shown
**Current**: VoteControls shows who CAN be voted for and who HAS voted, but not WHO voted for WHOM

**User Request**: "just make sure the voting works, like the voting logic and parsing votes from the AIs"

**What's Working**:
- ✅ Vote registration (all votes recorded)
- ✅ Vote resolution logic (tie-breaker, human protection)
- ✅ Phase transition after voting

**What's Missing**:
- ❌ Display of vote results (tally)
- ❌ Animation showing who was eliminated
- ❌ Vote reveal (who voted for whom - optional)

---

### Issue #5: No Round Transition Messages
**Severity**: Medium
**Status**: NOT IMPLEMENTED
**Requirement**: Show messages like "Round 2 begins..." between rounds

**Current Behavior**:
- ELIMINATION_1 resolves → immediate jump to ROUND_2
- No announcement, no pause, no context

**Required**:
1. After elimination, show message: "Round 2 - 2 AIs remain"
2. Brief pause (2-3 seconds)
3. Optionally: Secret Moderator gets updated prompt to "refresh" discussion

---

### Issue #6: Timer Doesn't Start After President TTS
**Severity**: Medium
**Status**: PARTIAL - Timer starts when phase changes, not after TTS

**User Requirement**: "Timer should start when President left the call, not when room opens"

**Current Behavior** (`moderatorController.js:246-262`):
```javascript
onPresidentIntroComplete() {
  setTimeout(() => {
    this.disconnectPlayer('moderator');
    this.setPhase(GAME_PHASES.SELF_ORGANIZATION); // Timer NOT started here
  }, 5000);
}
```

Then later when first AI speaks → ROUND_1 starts → Timer starts

**Issue**: Timer starts when ROUND_1 phase begins, which happens after first AI speaks, not immediately after President leaves

**Fix Needed**: Start timer in `onPresidentIntroComplete()` after the 5-second delay

---

### Issue #7: Round 3 President Question Not Implemented
**Severity**: High (Future)
**Status**: NOT IMPLEMENTED
**Requirement**: In ROUND_3, President asks one creative question to trigger 1-on-1 debate

**Not Yet Needed**: Only becomes relevant when game reaches Round 3

---

### Issue #8: Final Verdict System Not Implemented
**Severity**: High (Future)
**Status**: NOT IMPLEMENTED
**Requirement**: Unbiased AI verdict with transcript anonymization

**Not Yet Needed**: Only becomes relevant when game reaches final verdict phase

---

## 🎯 PRIORITY ORDER

### URGENT (Must fix for basic game to work):
1. ✅ ~~Voting panel appearance~~ FIXED
2. ✅ ~~AI auto-voting~~ WORKING
3. **10-second elimination delay** ← DO THIS NEXT
4. **Vote tally display** ← THEN THIS
5. **Elimination sound effect**

### MEDIUM (Needed for good UX):
6. Round transition messages
7. Fix timer start trigger
8. Fix "You," phantom player issue

### FUTURE (Needed for Round 3):
9. President Round 3 question
10. Final verdict system

---

## 📝 NOTES

- User entered "Chirs" as name (typo, not a bug)
- Pronoun usage is now 90% correct after removing replacement code
- AI voting is using Gemini API successfully
- Phase transitions are working (ROUND_1 → ELIMINATION_1 → ROUND_2)
