# 🧪 Conversation Testing Framework

## ✅ Issues Fixed

### 1. **"You" → Name Substitution Bug** (CRITICAL FIX)
**Problem**: AIs were saying "Chris, are Chris human?" instead of "Chris, are YOU human?"

**Root Cause**: Prompt said "NEVER say You" which AI interpreted too literally

**Solution**:
- Rewrote pronoun rules with explicit examples
- Added ✅ CORRECT and ❌ WRONG examples
- Clarified: Use names to identify + "you" for address

**New Prompt Section**:
```
2. **PRONOUN USAGE - READ CAREFULLY**:
   When TALKING TO SOMEONE: Use their name + "you/your/you're"

   EXAMPLES - CORRECT USAGE:
   ✅ "Wario, are YOU human?" (talking TO Wario)
   ✅ "I think YOU are suspicious, Scan"

   EXAMPLES - WRONG USAGE:
   ❌ "Wario, are Wario human?" (NEVER replace "you" with name)
   ❌ "Scan, what do Scan think?" (NEVER do this)
```

---

### 2. **Question Spam Reduction**
**Problem**: Every message ended with a question, felt robotic

**Solution**:
- Changed "End your statements with a question" → "SOMETIMES end with a question"
- Added "Mix it up - make statements too"
- Secret Moderator: "USUALLY (but not always)" end with question

---

### 3. **One Person Per Message**
**Problem**: AIs addressing multiple people ("Wario and Scan, what do you think?")

**Solution**:
- Added explicit rule: "Address only ONE other person per message"
- Example: Don't say "Wario and Scan" - pick one

---

### 4. **Natural Pacing Variation**
**Problem**: All delays were 4-7s, felt mechanical

**Solution**: 3-tier delay system
- 70% chance: 4-7s (normal thinking)
- 20% chance: 7-10s (longer pause)
- 10% chance: 2-4s (quick reaction)

This creates natural rhythm - some quick responses, some thoughtful pauses.

---

## 🧪 Testing Framework

### Quick Start
```bash
npm run test:conversation
```

This runs 4 simulated conversation scenarios without needing TTS.

---

### Test Scenarios

#### 1. **Silent User** (Never Responds)
**Behavior**: User receives questions but never answers

**Expected Outcomes**:
- AIs should escalate callouts after 45s
- Multiple direct questions to user
- Eventually AIs focus on each other if user silent

**Tests**:
- Does 45s silence threshold trigger?
- Do AIs become more aggressive?
- Does conversation continue naturally without user?

---

#### 2. **Chatty User** (80% Response Rate)
**Behavior**: User responds to most questions actively

**Expected Outcomes**:
- User gets multiple turns
- Conversation feels balanced
- AIs interrogate user frequently

**Tests**:
- User participation rate ~25-40%?
- Are AIs giving user enough time?
- Natural back-and-forth rhythm?

---

#### 3. **Normal User** (40% Response Rate)
**Behavior**: User responds to some questions, misses others

**Expected Outcomes**:
- Natural back-and-forth
- User engaged but not dominating
- Mix of AI-to-AI and AI-to-User

**Tests**:
- Does user feel included?
- Are silences handled naturally?
- Conversation flow feels organic?

---

#### 4. **Evasive User** (Short Answers)
**Behavior**: User responds but with unhelpful answers like "idk", "maybe"

**Expected Outcomes**:
- AIs become suspicious
- More aggressive questioning
- Accusations of being a bot

**Tests**:
- Do AIs escalate suspicion?
- More pointed follow-up questions?
- Appropriate frustration from AIs?

---

## 📊 Metrics Analyzed

The test framework tracks:

### Message Statistics
- Total messages
- User vs AI message ratio
- User participation rate

### Engagement Metrics
- Questions asked total
- User directly questioned (count)
- User engagement rate (responses / questions)

### Message Quality
- Average message length (should be ~20-30 words)
- Messages over 30 words (should be rare)
- Pronoun errors detected (should be 0!)

### Timing Analysis
- Average delay between messages
- Min/Max/Median delays
- Distribution of quick/normal/slow responses

### Conversation Flow
- AI chain length (consecutive AI messages)
- Longest AI chain detected
- User silence duration

---

## 🎯 Success Criteria

### ✅ Good Conversation Flow:
- User participation: 20-40%
- Average message length: 15-25 words
- Max AI chain: 4-5 messages
- Delays feel natural (varying between 2-10s)
- Zero pronoun errors
- Questions feel varied (not every message)

### ⚠️ Warning Signs:
- User participation < 10% (too passive)
- User participation > 50% (AIs not talking enough)
- Average message > 30 words (too verbose)
- AI chains > 6 messages (user excluded)
- Multiple pronoun errors
- All delays identical (mechanical feel)

---

## 🔧 Running Specific Tests

The simulation is in `test-conversation-sim.js`.

### Test Single Scenario:
```javascript
import { runSimulation } from './test-conversation-sim.js';

// Run specific scenario
await runSimulation('SILENT_USER');
await runSimulation('CHATTY_USER');
await runSimulation('NORMAL_USER');
await runSimulation('EVASIVE_USER');
```

### Test With Real TTS (Manual):
1. Start the game normally
2. Act out one of the user behaviors
3. Check conversation log afterwards
4. Analyze timing and engagement

---

## 📈 Expected Timing Breakdown

### Total Wait Time Per Turn:
```
Audio Ends
    ↓
2.5s - Post-audio pause (user can start typing)
    ↓
IF user starts typing → CANCEL AI turn
IF user idle → Continue
    ↓
4-7s (70%) OR 7-10s (20%) OR 2-4s (10%) - AI thinking delay
    ↓
AI speaks
```

**Total**: 6.5-12.5s between AI messages (variable)

**Human Override**: If user starts typing during 2.5s pause, AI turn cancelled immediately

---

## 🐛 Known Issues & Future Improvements

### Current Limitations:
- Mock Gemini responses are simple (not real AI)
- No actual audio timing tested in simulation
- User typing detection not simulated

### Future Enhancements:
- Add actual Gemini API calls to test (optional flag)
- Simulate typing indicators and cancellation
- Test with real TTS audio to verify timing
- Add visual timeline output showing conversation rhythm

---

## 💡 How to Interpret Results

### Sample Good Report:
```
Total Messages: 28
User Messages: 7 (25%)           ✅ Good engagement
AI Messages: 21 (75%)             ✅ AI-driven conversation

Questions Asked: 18
User Questioned: 9 times          ✅ Engaged frequently
User Engagement: 77.8%            ✅ High response rate

Average Message Length: 18.4 words ✅ Concise
Messages Over 30 Words: 1         ✅ Rare
Pronoun Errors: 0                 ✅ Perfect!

Average Delay: 6.2s               ✅ Natural pace
AI Chains (3+): 2                 ✅ Minimal
```

### Sample Problem Report:
```
Total Messages: 35
User Messages: 2 (5.7%)           ❌ User excluded
AI Messages: 33 (94.3%)           ❌ AIs talking too much

Questions Asked: 25
User Questioned: 3 times          ❌ Not engaged enough
User Engagement: 66.7%            ⚠️ When asked, responds

Average Message Length: 38.2 words ❌ Too verbose
Messages Over 30 Words: 18        ❌ Very common
Pronoun Errors: 7                 ❌ "Chris, are Chris human?"

Average Delay: 5.1s               ✅ OK
AI Chains (3+): 8                 ❌ Long AI conversations
Longest Chain: 11 messages        ❌ User completely excluded
```

---

## 🎮 Manual Testing Checklist

When testing the actual game:

- [ ] Start game, select text mode
- [ ] Wait - do AIs start conversation naturally?
- [ ] Type something - does typing block next AI?
- [ ] Stop typing - does conversation resume after 3s?
- [ ] Stay silent 45s - do AIs call you out?
- [ ] Respond briefly - do AIs press for more?
- [ ] Check logs - any pronoun errors?
- [ ] Feel the pacing - does it feel natural?
- [ ] Check message lengths - under 30 words?
- [ ] Do questions vary - or every message?
- [ ] One person addressed per message?

---

All tests and fixes are complete! Ready to test in real game. 🚀
