# IDEAL SERVER LOG V2 - Reverse Turing Test Game Flow
## Complete Game Session with Second-Level Precision & Edge Cases

```
============================================================
GAME SESSION START - 2025-01-26 14:30:00.000
============================================================

T+0.000s  [SYSTEM] Game phase: LOBBY
T+0.000s  [CLIENT] Player "Alice" entered name, selected avatar
T+0.100s  [CLIENT] Player clicked "START GAME"

# ============================================================
# PHASE 1: CALL CONNECTING (Staggered Join Sequence)
# Duration: 4 seconds
# Purpose: Create anticipation, simulate real call join experience
# ============================================================

T+0.150s  [SYSTEM] Phase transition: LOBBY → CALL_CONNECTING
T+0.151s  [SYSTEM] Starting join sequence...
T+0.152s  [PLAYER] Alice (player1) connected to call
T+0.152s  [WS→CLIENT] Broadcast game state (connectedPlayers: [player1])
T+0.153s  [CLIENT] VideoGrid renders: 1 player visible

T+1.152s  [AI] player2 (Wario) connected
T+1.153s  [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2])
T+1.154s  [CLIENT] Join SFX plays 🔊
T+1.154s  [CLIENT] VideoGrid animates: 2 players visible

T+2.152s  [AI] player3 (Domis) connected
T+2.153s  [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, player3])
T+2.154s  [CLIENT] Join SFX plays 🔊
T+2.154s  [CLIENT] VideoGrid animates: 3 players visible

T+3.152s  [AI] player4 (Scan) connected
T+3.153s  [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, player3, player4])
T+3.154s  [CLIENT] Join SFX plays 🔊
T+3.154s  [CLIENT] VideoGrid animates: 4 players visible

T+4.152s  [MODERATOR] President Dorkesh connected
T+4.153s  [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, player3, player4, moderator])
T+4.154s  [CLIENT] Join SFX plays 🔊
T+4.154s  [CLIENT] VideoGrid animates: 5 players visible (President in red border)

# ============================================================
# PHASE 2: PRESIDENT INTRO
# Duration: ~18 seconds (mode selection + pre-recorded speech)
# Purpose: Set the scene, create tension
# NOTE: No Gemini generation - use pre-recorded MP3 or TTS once and cache
# ============================================================

T+4.200s  [SYSTEM] Phase transition: CALL_CONNECTING → PRESIDENT_INTRO
T+4.201s  [WS→CLIENT] Show Mode Selection Modal
T+4.202s  [CLIENT] Modal displayed: "Choose Voice or Text Mode"

T+6.500s  [CLIENT] User selected: VOICE MODE
T+6.501s  [WS→SERVER] SET_COMMUNICATION_MODE: voice
T+6.502s  [SYSTEM] Player communication mode set to: VOICE
T+6.503s  [CLIENT] Starting SpeechRecognition...
T+6.550s  [CLIENT] SpeechRecognition active ✅

# President speech (pre-recorded MP3, no API latency)
T+6.600s  [PRESIDENT] Loading pre-recorded intro speech
T+6.601s  [PRESIDENT] Transcript: "Greetings. I am President Dorkesh Cartel. The simulation is collapsing. One of you is human. The rest are bots pretending to be human. You have three rounds to identify the human. Debate. Vote. Decide. I will return for the final judgment."
T+6.602s  [PRESIDENT] Using cached MP3 file (no TTS generation needed)
T+6.603s  [WS→CLIENT] AUDIO_PLAYBACK (moderator, audioData: <base64>)
T+6.604s  [CLIENT] Playing pre-recorded audio
T+6.605s  [QUEUE] Active speaker: moderator

# President speaking - 15 seconds of pre-recorded audio
T+6.650s  [AUDIO] "Greetings. I am President Dorkesh Cartel..."
T+21.650s [AUDIO] "...I will return for the final judgment."
T+21.651s [CLIENT] Audio playback complete
T+21.652s [WS→SERVER] AUDIO_COMPLETE (moderator)
T+21.653s [QUEUE] Active speaker: null

# President leaves after 1.5s delay (dramatic pause)
T+23.150s [SYSTEM] President intro complete (1.5s delay for effect)
T+23.151s [MODERATOR] President disconnected
T+23.152s [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, player3, player4])
T+23.153s [CLIENT] Drop-off SFX plays 🔊

# ============================================================
# PHASE 3: ROUND 1 - OVERLAY & IMMEDIATE START
# Duration: 5s overlay + 90s round
# Purpose: Visual transition, queue first AI during overlay
# NOTE: No "self-organization" phase - pick Secret Moderator randomly
# ============================================================

# Overlay starts IMMEDIATELY after President leaves
T+23.154s [SYSTEM] Phase transition: PRESIDENT_INTRO → ROUND_1
T+23.155s [SYSTEM] Picking Secret Moderator randomly from [player2, player3, player4]...
T+23.156s [SYSTEM] Secret Moderator selected: player3 (Domis)
T+23.157s [AI] Sending Secret Moderator instructions to player3
T+23.158s [SYSTEM] Starting 90-second round timer
T+23.159s [SYSTEM] Round end time: T+113.154s
T+23.160s [WS→CLIENT] Broadcast game state (phase: ROUND_1, roundEndTime: T+113.154s)
T+23.161s [CLIENT] Shows "ROUND 1" overlay (5 seconds)
T+23.162s [AI] Sending system notification to all AIs: "Round 1 has begun. 90 seconds to identify the human."

# CRITICAL: Queue SECRET MODERATOR DURING overlay so they speak immediately when round starts
T+23.200s [AI] Pre-queueing Secret Moderator (player3) for immediate start
T+23.201s [AI→player3] Prompt: "Round 1 just started. As Secret Moderator, you go first. Jump right in - ask Alice a direct, challenging question. Stay in character as Domis. Keep under 25 words."
T+24.350s [GEMINI→player3] Response generated (1.15s latency)
T+24.351s [AI→player3] Transcript: "Okay, let's cut through the BS. Alice, what's your BIGGEST fear? And don't give me some safe answer - something REAL."
T+24.352s [CONVERSATION] Added to history
T+24.353s [TTS] Requesting audio from ElevenLabs (voice: Domis)
T+25.250s [TTS] Stream ready (0.9s latency)
T+25.251s [QUEUE] Audio ready for player3, waiting for overlay to finish...

# Overlay finishes, round officially starts
T+28.161s [SYSTEM] Round 1 overlay complete, round officially active
T+28.162s [SYSTEM] Releasing queued audio for player3

# Secret Moderator speaks 0.5s into the round (not 3-5s!)
T+28.662s [WS→CLIENT] AUDIO_STREAM_START (player3)
T+28.663s [QUEUE] Active speaker: player3
T+28.664s [CLIENT] Domis (Secret Moderator) starts speaking immediately

# Exchange 1: Secret Moderator (Domis) opens (pre-queued during overlay)
T+28.700s [AUDIO] "Okay, let's cut through the BS. Alice, what's your BIGGEST fear?..."
T+33.500s [AUDIO] "...something REAL."
T+33.501s [WS→SERVER] AUDIO_COMPLETE (player3)
T+33.502s [QUEUE] Active speaker: null
T+33.503s [TURN] Detected direct question to player1 (Alice)
T+33.504s [TURN] Setting waitingForResponseFrom: player1, deadline: 7s

# Exchange 2: Alice responds to opening question
T+35.000s [CLIENT] SpeechRecognition: speech detected
T+35.001s [CLIENT] isSpeaking: true
T+39.300s [CLIENT] SpeechRecognition: speech ended
T+39.301s [CLIENT] isSpeaking: false
T+39.302s [CLIENT] Transcript: "I'm Alice, I'm a software engineer working on AI safety. I'm human because I can tell you about my irrational fear of spiders and how I cried watching a sad movie last week."
T+39.303s [WS→SERVER] HUMAN_INPUT
T+39.304s [CONVERSATION] Added to history: Alice → "I'm Alice, I'm a software engineer..."
T+39.305s [TURN] Human responded, clearing waitingForResponseFrom
T+39.306s [TURN] Last human message time updated: T+39.304s
T+39.307s [WS→CLIENT] Broadcast game state (updated transcript)

# Exchange 3: Next AI responds (not Domis who just spoke, not Alice)
T+39.400s [TURN] Queue empty, waiting 800ms before next turn...
T+40.200s [TURN] Recent speakers: [player3, player1]
T+40.201s [TURN] Candidates: [player2, player4]
T+40.202s [TURN] Selected: player4 (Scan) randomly
T+40.203s [AI] Triggering response from player4
T+40.204s [AI→player4] Prompt: "[Alice just said]: 'I'm Alice, I'm a software engineer...'\n\n[Respond naturally, stay in character, keep under 30 words]"
T+40.205s [AI→player4] Context: Last 8 messages from conversation
T+41.400s [GEMINI→player4] Response generated (1.2s latency)
T+41.401s [AI→player4] Transcript: "Spiders and sad movies? How CONVENIENT. I'm Scan Ctrl+Altman. Alice, what's 17 times 23? Quick, no hesitation."
T+41.402s [CONVERSATION] Added to history
T+41.403s [QUEUE] Queueing audio for player4
T+42.300s [TTS] Stream started (0.9s latency)
T+42.301s [WS→CLIENT] AUDIO_STREAM_START (player4)
T+42.302s [QUEUE] Active speaker: player4

T+42.350s [AUDIO] "Spiders and sad movies? How CONVENIENT..."
T+47.000s [AUDIO] "...Quick, no hesitation."
T+47.001s [WS→SERVER] AUDIO_COMPLETE (player4)
T+47.002s [QUEUE] Active speaker: null
T+47.003s [TURN] Detected direct question to player1
T+47.004s [TURN] Setting waitingForResponseFrom: player1, deadline: 7s

# ============================================================
# EDGE CASE 1: HUMAN DOESN'T RESPOND (7s DEADLINE EXPIRES)
# Scenario: Alice is asked a question but doesn't respond within 7s
# AI who asked should comment on her silence and continue
# ============================================================

# For this example, let's show Alice NOT responding (alternative flow)
# [Alternative timeline where Alice doesn't respond:]

T+54.004s [TURN] ⏰ Response deadline expired for player1 (7s elapsed)
T+54.005s [TURN] Human failed to respond within 7s - highly suspicious
T+54.006s [TURN] Clearing waitingForResponseFrom
T+54.007s [TURN] Forcing response from player4 (who asked the question)
T+54.008s [AI] Triggering response from player4
T+54.009s [AI→player4] Prompt: "[SYSTEM]: Alice didn't respond to your question within 7 seconds. Comment on her silence as VERY suspicious and ask another question. Stay aggressive. Keep under 30 words."
T+55.200s [GEMINI→player4] Response generated (1.2s latency)
T+55.201s [AI→player4] Transcript: "Wow, Alice is SILENT. Can't even answer a simple math question? That's EXACTLY what a bot would do - freeze up. Alice, what's your mother's maiden name?"
T+55.202s [CONVERSATION] Added to history
T+55.203s [QUEUE] Queueing audio for player4
T+56.100s [TTS] Stream started (0.9s latency)
T+56.101s [WS→CLIENT] AUDIO_STREAM_START (player4)
T+56.102s [QUEUE] Active speaker: player4

T+56.150s [AUDIO] "Wow, Alice is SILENT. Can't even answer..."
T+60.800s [AUDIO] "...what's your mother's maiden name?"
T+60.801s [WS→SERVER] AUDIO_COMPLETE (player4)
T+60.802s [QUEUE] Active speaker: null
T+60.803s [TURN] Detected new direct question to player1
T+60.804s [TURN] Setting waitingForResponseFrom: player1, deadline: 7s

# [Back to normal timeline - Alice DID respond at T+39.3s, continuing from there...]

# ============================================================
# EDGE CASE 2: HUMAN INTERRUPTS (BARGE-IN) - VOICE MODE
# Scenario: Alice starts speaking while Scan is still talking
# NOTE: Text mode works similarly - typing triggers USER_TYPING_START
#       which can also cancel pending AI turns and signal activity
# ============================================================

# Let's rewind and show what happens if Alice interrupts at T+44.000s

T+44.000s [CLIENT] SpeechRecognition: speechstart event fired
T+44.001s [CLIENT] User started speaking (barge-in detected!)
T+44.002s [CLIENT] isSpeaking: true
T+44.003s [CLIENT] Calling stopAudio() - interrupting player4
T+44.004s [CLIENT] Current audio paused and cleared
T+44.005s [CLIENT] MediaSource cleanup started
T+44.006s [WS→SERVER] AUDIO_INTERRUPT
T+44.007s [QUEUE] Interruption received - clearing queue and active speaker
T+44.008s [QUEUE] Active speaker was: player4
T+44.009s [QUEUE] Dropping queued messages: [] (none)
T+44.010s [QUEUE] Active speaker: null
T+44.011s [AUDIO] Scan's audio cut off mid-sentence
T+44.012s [LOGGER] Log barge-in: human interrupted player4 at T+44.000s

T+44.500s [CLIENT] SpeechRecognition: speech ended
T+44.501s [CLIENT] isSpeaking: false
T+44.502s [CLIENT] Transcript: "Wait, 17 times 23? Uh... 391. I had to think about it for a second."
T+44.503s [WS→SERVER] HUMAN_INPUT
T+44.504s [CONVERSATION] Added to history
T+44.505s [TURN] Human interrupted and responded

# System continues normally - next AI responds to human's answer
T+45.300s [TURN] Selecting next speaker (not player4, was interrupted)
T+45.301s [TURN] Candidates: [player2, player3]
T+45.302s [TURN] Selected: player3 (Domis, Secret Moderator)
T+46.500s [GEMINI→player3] Response generated
T+46.501s [AI→player3] Transcript: "391 is correct, but you HESITATED. That's either human or you're very good at faking it. Wario, what do YOU think of Alice?"
T+46.502s [CONVERSATION] Added to history
T+46.503s [QUEUE] Queueing audio for player3
T+47.350s [TTS] Stream started
T+47.351s [WS→CLIENT] AUDIO_STREAM_START (player3)
T+47.352s [QUEUE] Active speaker: player3

T+47.400s [AUDIO] "391 is correct, but you HESITATED..."
T+52.800s [AUDIO] "...Wario, what do YOU think of Alice?"
T+52.801s [WS→SERVER] AUDIO_COMPLETE (player3)
T+52.802s [QUEUE] Active speaker: null
T+52.803s [TURN] Detected question to player2 (Wario)

# Exchange 4: Wario answers about Alice
T+52.900s [AI] Forcing response from player2 (direct question)
T+54.100s [GEMINI→player2] Response generated
T+54.101s [AI→player2] Transcript: "Alice is suspicious. Too many 'perfect' human traits listed upfront. Alice, tell me something EMBARRASSING. Something you'd never admit."
T+54.102s [CONVERSATION] Added to history
T+54.103s [QUEUE] Queueing audio for player2
T+54.950s [TTS] Stream started
T+54.951s [WS→CLIENT] AUDIO_STREAM_START (player2)
T+54.952s [QUEUE] Active speaker: player2

T+55.000s [AUDIO] "Alice is suspicious..."
T+59.800s [AUDIO] "...Something you'd never admit."
T+59.801s [WS→SERVER] AUDIO_COMPLETE (player2)
T+59.802s [QUEUE] Active speaker: null

# Exchange 5: Alice shares embarrassing story
T+61.300s [CLIENT] SpeechRecognition: speech detected
T+66.200s [CLIENT] Transcript: "Fine. Last year I tripped walking into a meeting and spilled coffee all over myself in front of the entire executive team. I wanted to disappear."
T+66.201s [WS→SERVER] HUMAN_INPUT
T+66.202s [CONVERSATION] Added to history

# Continue conversation...
T+67.000s [TURN] Selecting next speaker: player4
# [Similar pattern continues...]

# ============================================================
# EDGE CASE 2: HUMAN SILENT FOR 30+ SECONDS
# Scenario: Alice hasn't spoken since T+66.201s, now at T+98.000s
# ============================================================

T+96.201s [TURN] Checking human silence... (30s since last message)
T+96.202s [TURN] Human has been silent for 30.0s - triggering callout
T+96.203s [TURN] Human silence warning not yet issued
T+96.204s [TURN] Selecting questioner: player3 (Secret Moderator)
T+96.205s [AI] Triggering aggressive callout to player3
T+96.206s [AI→player3] Prompt: "[CRITICAL ALERT]: Alice has been SILENT for 30 seconds! This is EXTREMELY suspicious. You need to call them out AGGRESSIVELY..."
T+97.400s [GEMINI→player3] Response generated
T+97.401s [AI→player3] Transcript: "ALICE! You've been SILENT this whole time while we've been talking. That's EXACTLY what a bot would do. Speak UP or we're voting for YOU!"
T+97.402s [CONVERSATION] Added to history
T+97.403s [QUEUE] Queueing audio for player3
T+98.200s [TTS] Stream started
T+98.201s [WS→CLIENT] AUDIO_STREAM_START (player3)
T+98.202s [QUEUE] Active speaker: player3
T+98.203s [TURN] Human silence warning issued: true

T+98.250s [AUDIO] "ALICE! You've been SILENT this whole time..."
T+102.500s [AUDIO] "...Speak UP or we're voting for YOU!"
T+102.501s [WS→SERVER] AUDIO_COMPLETE (player3)
T+102.502s [QUEUE] Active speaker: null

# Alice responds to callout
T+103.800s [CLIENT] SpeechRecognition: speech detected
T+106.500s [CLIENT] Transcript: "Sorry, I was just listening and thinking. I didn't realize staying quiet was suspicious. I'm trying to figure out who among you is lying."
T+106.501s [WS→SERVER] HUMAN_INPUT
T+106.502s [CONVERSATION] Added to history
T+106.503s [TURN] Human silence warning reset: false
T+106.504s [TURN] Last human message time: T+106.501s

# [Continue exchanges until timer expires...]

T+111.658s [SYSTEM] ⏰ ROUND 1 TIMER EXPIRED
T+111.659s [SYSTEM] Stopping round timer
T+111.660s [CLIENT] Buzzer sound plays 🔊
T+111.661s [SYSTEM] Phase transition: ROUND_1 → ELIMINATION_1

# ============================================================
# PHASE 4: ELIMINATION 1 - VOTING (NO CHATTER)
# Duration: ~12 seconds (AI voting + human vote + results)
# NOTE: No speeches, just vote → results → next round
# ============================================================

T+111.662s [WS→CLIENT] Broadcast game state (phase: ELIMINATION_1)
T+111.663s [AI] Sending system notification: "Time is up! Voting phase. Vote to eliminate one player."
T+111.664s [SYSTEM] Triggering AI auto-voting...
T+111.665s [VOTE] Scheduling staggered votes for [player2, player3, player4]

# AI votes stagger by 0.5-1.5s each (fast voting, no speeches)
T+112.165s [VOTE] player2 voting... (0.5s delay)
T+113.300s [GEMINI] Vote response: "player4"
T+113.301s [VOTE] player2 voted for player4
T+113.302s [WS→CLIENT] Broadcast game state (votes: {player2: player4})

T+113.665s [VOTE] player3 voting... (1.5s total delay)
T+114.800s [GEMINI] Vote response: "player1" (voted for Alice!)
T+114.801s [VOTE] player3 voted for player1
T+114.802s [WS→CLIENT] Broadcast game state

T+115.165s [VOTE] player4 voting... (2.5s total delay)
T+116.400s [GEMINI] Vote response: "player2"
T+116.401s [VOTE] player4 voted for player2
T+116.402s [WS→CLIENT] Broadcast game state

# Human votes via UI
T+118.000s [CLIENT] User clicked vote button → player3 (Domis)
T+118.001s [WS→SERVER] CAST_VOTE: player3
T+118.002s [VOTE] player1 voted for player3
T+118.003s [VOTE] All votes cast (4/4 active players)
T+118.004s [VOTE] Calculating results...

# Vote tally
T+118.005s [VOTE] Tally: {player1: 1, player2: 1, player3: 1, player4: 1}
T+118.006s [VOTE] TIE DETECTED - all players tied at 1 vote
T+118.007s [VOTE] Tie-breaker: Human (player1) is SAFE (always safe in ties)
T+118.008s [VOTE] Remaining candidates: [player2, player3, player4]
T+118.009s [VOTE] Random selection from AI candidates...
T+118.010s [VOTE] ELIMINATED: player4 (Scan)
T+118.011s [VOTE] Storing results: {tally: {...}, eliminatedId: player4, isTie: true}
T+118.012s [WS→CLIENT] Broadcast game state (voteResults: {...})
T+118.013s [CLIENT] Showing vote results UI with 10-second countdown

# ============================================================
# EDGE CASE 5: HUMAN GETS MAJORITY VOTES (GAME OVER - LOSE)
# Scenario: Multiple AIs vote for Alice, she gets eliminated
# Game ends immediately, no more rounds
# ============================================================

# [Alternative voting scenario - showing human getting eliminated:]
# T+116.402s [VOTE] player4 voted for player1 (instead of player2)
# T+118.000s [CLIENT] User voted for player3 (Domis)
# T+118.001s [WS→SERVER] CAST_VOTE: player3
# T+118.002s [VOTE] player1 voted for player3
# T+118.003s [VOTE] All votes cast (4/4 active players)
# T+118.004s [VOTE] Calculating results...
# T+118.005s [VOTE] Tally: {player1: 2, player2: 0, player3: 1, player4: 0}
# T+118.006s [VOTE] player1 (HUMAN) has MAJORITY of votes (2/4)
# T+118.007s [VOTE] ELIMINATED: player1 (Alice) - HUMAN ELIMINATED!
# T+118.008s [VOTE] GAME OVER - Human identified as bot
# T+118.009s [VOTE] Storing results: {tally: {...}, eliminatedId: player1, isHuman: true}
# T+118.010s [WS→CLIENT] Broadcast game state (voteResults: {...}, gameOver: true, result: 'lose')
# T+118.011s [CLIENT] Showing vote results UI with 10-second countdown
#
# # 10-second reveal
# T+128.010s [SYSTEM] Executing elimination
# T+128.011s [PLAYER] Eliminating player1 (Alice)
# T+128.012s [PLAYER] HUMAN ELIMINATED - GAME OVER
# T+128.013s [SYSTEM] Phase transition: ELIMINATION_1 → GAME_OVER
# T+128.014s [WS→CLIENT] Broadcast game state (phase: GAME_OVER, result: 'lose')
# T+128.015s [CLIENT] Shows EndScreen with "YOU LOSE" animation
# T+128.016s [CLIENT] Defeat sound plays 💀
# T+128.017s [CLIENT] Only option: "Back to Lobby" button
# T+128.018s [SYSTEM] Game session ended

# [Back to normal timeline where player4 was eliminated...]

# 10-second dramatic reveal
T+128.012s [SYSTEM] Executing elimination after 10s reveal
T+128.013s [PLAYER] Eliminating player4 (Scan)
T+128.014s [PLAYER] Added to eliminatedPlayers: [player4]
T+128.015s [PLAYER] Disconnecting player4
T+128.016s [WS→CLIENT] Broadcast game state (eliminatedPlayers: [player4], connectedPlayers: [player1, player2, player3])
T+128.017s [CLIENT] Drop-off SFX plays 🔊
T+128.018s [CLIENT] VideoGrid removes player4

# NO SECRET MODERATOR REACTION HERE
# Reaction happens INSIDE Round 2 after it starts

# ============================================================
# PHASE 5: ROUND 2 - OVERLAY & START
# Duration: 5s overlay + 90s round
# Participants: 3 players (Alice, Wario, Domis)
# NOTE: Secret Moderator comments on elimination WITHIN the round
# ============================================================

# Round 2 overlay starts IMMEDIATELY after elimination
T+128.100s [SYSTEM] Phase transition: ELIMINATION_1 → ROUND_2
T+128.101s [SYSTEM] Starting 90-second round timer
T+128.102s [SYSTEM] Round end time: T+218.100s
T+128.103s [WS→CLIENT] Broadcast game state (phase: ROUND_2, roundEndTime: T+218.100s)
T+128.104s [CLIENT] Shows "ROUND 2" overlay (5 seconds)
T+128.105s [AI] System notification: "Round 2 has begun. Scan has been eliminated."

# Pre-queue Secret Moderator to comment on elimination + start round
T+128.200s [AI] Pre-queueing Secret Moderator (player3) for immediate round start
T+128.201s [AI→player3] Prompt: "[SYSTEM]: Round 2 has started. Scan has been eliminated. Comment on the elimination and continue the debate. Keep under 30 words."
T+129.400s [GEMINI→player3] Response generated (1.2s latency)
T+129.401s [AI→player3] Transcript: "Scan is OUT. Three of us left - Alice, Wario, and me. One of us is lying. Alice, you got lucky last round. What's your earliest childhood memory?"
T+129.402s [CONVERSATION] Added to history
T+129.403s [TTS] Requesting audio
T+130.300s [TTS] Stream ready (0.9s latency)
T+130.301s [QUEUE] Audio ready for player3, waiting for overlay...

# Overlay finishes
T+133.104s [SYSTEM] Round 2 overlay complete
T+133.105s [SYSTEM] Releasing queued audio for player3

# Secret Moderator speaks immediately (0.5s into round)
T+133.605s [WS→CLIENT] AUDIO_STREAM_START (player3)
T+133.606s [QUEUE] Active speaker: player3
T+133.607s [CLIENT] Domis speaks immediately, commenting on elimination

T+133.650s [AUDIO] "Scan is OUT. Three of us left..."
T+138.800s [AUDIO] "...What's your earliest childhood memory?"
T+138.801s [WS→SERVER] AUDIO_COMPLETE (player3)
T+138.802s [QUEUE] Active speaker: null
T+138.803s [TURN] Detected direct question to player1

# Round 2 continues with normal exchanges...
# [Similar pattern to Round 1, but more intense]

# ============================================================
# EDGE CASE 3: TIMER EXPIRES DURING AI SPEECH
# Scenario: Round timer expires while AI is mid-sentence
# System interrupts active speaker with buzzer and clears queue
# ============================================================

# [Fast-forward through Round 2 - showing final exchange where timer expires mid-speech...]

T+212.000s [AI] player2 (Wario) triggered to respond
T+213.200s [GEMINI→player2] Response generated
T+213.201s [AI→player2] Transcript: "Alice, I don't buy your story. You're too prepared, too perfect. Tell me something you're ashamed of, something that keeps you up at night..."
T+213.202s [CONVERSATION] Added to history
T+213.203s [QUEUE] Queueing audio for player2
T+214.050s [TTS] Stream started
T+214.051s [WS→CLIENT] AUDIO_STREAM_START (player2)
T+214.052s [QUEUE] Active speaker: player2

T+214.100s [AUDIO] "Alice, I don't buy your story. You're too prepared, too perfect..."
# Wario is mid-sentence when Round 2 timer expires!
T+218.100s [SYSTEM] ⏰ ROUND 2 TIMER EXPIRED (Wario still speaking!)
T+218.101s [SYSTEM] Phase transition triggered: ROUND_2 → ELIMINATION_2
T+218.102s [SYSTEM] Interrupting active audio for phase transition
T+218.103s [QUEUE] Clearing queue: [] (empty)
T+218.104s [QUEUE] Interrupting active speaker: player2
T+218.105s [QUEUE] Active speaker: null
T+218.106s [WS→CLIENT] AUDIO_INTERRUPT
T+218.107s [CLIENT] Stopping audio playback mid-sentence
T+218.108s [CLIENT] Buzzer sound plays 🔊 (round end signal)
T+218.109s [AUDIO] Wario's speech cut off: "...something you're ashamed of—" [INTERRUPTED]
T+218.110s [WS→CLIENT] Broadcast game state (phase: ELIMINATION_2)

# ============================================================
# EDGE CASE 4: SECRET MODERATOR GETS ELIMINATED
# Scenario: player3 (Domis) is eliminated in Round 2
# ============================================================

# Voting phase (fast)
T+218.200s [VOTE] Starting AI auto-voting...
T+220.500s [VOTE] player2 voted for player3
T+222.000s [VOTE] player3 voted for player1
T+223.800s [CLIENT] User voted for player3
T+223.801s [VOTE] All votes cast
T+223.802s [VOTE] Tally: {player1: 1, player2: 0, player3: 2}
T+223.803s [VOTE] ELIMINATED: player3 (Domis) - 2 votes
T+223.804s [VOTE] SECRET MODERATOR ELIMINATED!
T+223.805s [WS→CLIENT] Broadcast results

# 10-second reveal
T+233.804s [SYSTEM] Executing elimination
T+233.805s [PLAYER] Eliminating player3 (Domis)
T+233.806s [PLAYER] Added to eliminatedPlayers: [player4, player3]
T+233.807s [PLAYER] Secret Moderator (player3) eliminated - selecting new Secret Moderator
T+233.808s [PLAYER] Remaining AIs: [player2]
T+233.809s [PLAYER] New Secret Moderator: player2 (Wario) - only AI left
T+233.810s [AI] Sending Secret Moderator instructions to player2
T+233.811s [WS→CLIENT] Broadcast game state (eliminatedPlayers: [player4, player3])
T+233.812s [CLIENT] Drop-off SFX plays 🔊

# ============================================================
# PHASE 6: ROUND 3 - FINAL ROUND (PRESIDENT RETURNS)
# Duration: 5s overlay + 90s round
# Participants: 2 players (Alice, Wario) + President
# Special: President asks question, then leaves them to debate
# ============================================================

T+233.900s [SYSTEM] Phase transition: ELIMINATION_2 → ROUND_3
T+233.901s [SYSTEM] Starting 90-second round timer
T+233.902s [SYSTEM] Round end time: T+323.900s
T+233.903s [WS→CLIENT] Broadcast game state (phase: ROUND_3)
T+233.904s [CLIENT] Shows "FINAL ROUND" overlay (5 seconds)

# President connects DURING overlay (not after)
T+234.000s [MODERATOR] President Dorkesh connecting...
T+234.001s [PLAYER] President connected
T+234.002s [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, moderator])
T+234.003s [CLIENT] Join SFX plays 🔊

# Pre-queue President's announcement DURING overlay
T+234.100s [PRESIDENT] Preparing announcement (pre-scripted, no Gemini)
T+234.101s [PRESIDENT] Transcript: "I have returned. Domis and Scan have been eliminated. Only Alice and Wario remain. This is your final round."
T+234.102s [PRESIDENT] Using cached/TTS audio
T+234.103s [TTS] Audio ready
T+234.104s [QUEUE] Audio ready for moderator, waiting for overlay...

# Overlay finishes
T+238.904s [SYSTEM] Round 3 overlay complete
T+238.905s [SYSTEM] Releasing queued President audio

# President speaks immediately
T+239.405s [WS→CLIENT] AUDIO_PLAYBACK (moderator)
T+239.406s [QUEUE] Active speaker: moderator
T+239.407s [CLIENT] President speaks

T+239.450s [AUDIO] "I have returned. Domis and Scan have been eliminated..."
T+244.200s [AUDIO] "...This is your final round."
T+244.201s [WS→SERVER] AUDIO_COMPLETE (moderator)
T+244.202s [QUEUE] Active speaker: null

# President asks deeply personal question (2s delay)
T+246.200s [PRESIDENT] Asking final question
T+246.201s [PRESIDENT] Selected question (random): "Alice, when was the last time you cried, and why?"
T+246.202s [PRESIDENT] Using pre-generated TTS (cached for this question)
T+246.203s [QUEUE] Queueing audio for moderator
T+246.204s [WS→CLIENT] AUDIO_PLAYBACK (moderator)
T+246.205s [QUEUE] Active speaker: moderator

T+246.250s [AUDIO] "Alice, when was the last time you cried, and why?"
T+249.500s [AUDIO] (question ends)
T+249.501s [WS→SERVER] AUDIO_COMPLETE (moderator)
T+249.502s [QUEUE] Active speaker: null
T+249.503s [TURN] Direct question to Alice detected

# President leaves after asking question (2s delay for effect)
T+251.500s [MODERATOR] President disconnected
T+251.501s [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2])
T+251.502s [CLIENT] Drop-off SFX plays 🔊
T+251.503s [SYSTEM] President has left, debate continues between Alice and Wario

# Alice answers President's question
T+253.200s [CLIENT] SpeechRecognition: speech detected
T+258.800s [CLIENT] Transcript: "Last week. I was watching a documentary about climate refugees and just... the weight of it all hit me. I felt completely helpless and overwhelmed."
T+258.801s [WS→SERVER] HUMAN_INPUT
T+258.802s [CONVERSATION] Added to history

# Wario (now Secret Moderator) responds
T+259.600s [TURN] Selecting player2 (only remaining AI)
T+260.800s [GEMINI→player2] Response generated
T+260.801s [AI→player2] Transcript: "Climate refugees made you cry? That's either deeply empathetic or a perfectly programmed emotional response. Alice, do you dream? What was your last dream about?"
T+260.802s [CONVERSATION] Added to history
T+260.803s [QUEUE] Queueing audio for player2
T+261.650s [TTS] Stream started
T+261.651s [WS→CLIENT] AUDIO_STREAM_START (player2)

T+261.700s [AUDIO] "Climate refugees made you cry?..."
T+267.200s [AUDIO] "...What was your last dream about?"
T+267.201s [WS→SERVER] AUDIO_COMPLETE (player2)
T+267.202s [QUEUE] Active speaker: null

# Alice shares dream (building trust)
T+269.000s [CLIENT] SpeechRecognition: speech detected
T+274.500s [CLIENT] Transcript: "I had a dream last night that I was back in my childhood home, but all the doors were locked and I couldn't find my parents. I woke up feeling anxious."
T+274.501s [WS→SERVER] HUMAN_INPUT
T+274.502s [CONVERSATION] Added to history

# Wario continues questioning
T+275.300s [TURN] Selecting player2
T+276.500s [GEMINI→player2] Response generated
T+276.501s [AI→player2] Transcript: "Locked doors, missing parents - classic anxiety dream. But you described it too perfectly. Alice, tell me - when you look in the mirror, what do you see? And I don't mean your reflection."
T+276.502s [CONVERSATION] Added to history
T+276.503s [QUEUE] Queueing audio for player2
T+277.350s [TTS] Stream started
T+277.351s [WS→CLIENT] AUDIO_STREAM_START (player2)

T+277.400s [AUDIO] "Locked doors, missing parents..."
T+283.500s [AUDIO] "...And I don't mean your reflection."
T+283.501s [WS→SERVER] AUDIO_COMPLETE (player2)
T+283.502s [QUEUE] Active speaker: null

# Alice gives deep answer
T+285.200s [CLIENT] SpeechRecognition: speech detected
T+291.000s [CLIENT] Transcript: "I see someone who's trying to do good in the world but feels like it's never enough. Someone who's scared of failing the people who depend on them. Someone who's tired."
T+291.001s [WS→SERVER] HUMAN_INPUT
T+291.002s [CONVERSATION] Added to history

# [Continue back-and-forth for remaining time...]

# ============================================================
# EDGE CASE 4: MULTIPLE AIS RESPOND SIMULTANEOUSLY
# Scenario: Two AIs generate responses at nearly the same time
# NOTE: This shouldn't happen in Round 3 (only 1 AI), but showing for completeness
# ============================================================

# Hypothetical scenario (if there were 2+ AIs):
T+295.000s [GEMINI→player2] Response A generated
T+295.001s [AI→player2] Transcript: "Response A..."
T+295.002s [CONVERSATION] Added to history
T+295.003s [QUEUE] Queueing audio for player2
T+295.004s [QUEUE] lastResponseTimestamp: T+295.003s

T+295.500s [GEMINI→player3] Response B generated (only 0.5s later)
T+295.501s [AI→player3] Checking simultaneous response window...
T+295.502s [AI→player3] Time since last response: 0.499s (< 1000ms)
T+295.503s [AI→player3] ❌ DISMISSING simultaneous response from player3
T+295.504s [LOGGER] Dismissed simultaneous response: player3 (within 1000ms window)

# Only player2's response plays
T+295.800s [TTS] Stream started for player2
T+295.801s [WS→CLIENT] AUDIO_STREAM_START (player2)

# [Back to regular Round 3 flow...]

T+323.900s [SYSTEM] ⏰ ROUND 3 TIMER EXPIRED
T+323.901s [CLIENT] Buzzer sound plays 🔊
T+323.902s [SYSTEM] Phase transition: ROUND_3 → PRESIDENT_VERDICT

# ============================================================
# PHASE 7: PRESIDENT VERDICT - FINAL JUDGMENT
# Duration: ~25 seconds
# Purpose: President analyzes and delivers verdict
# NOTE: President never left in this version, he returns now
# ============================================================

T+324.000s [SYSTEM] Phase transition complete
T+324.001s [SYSTEM] Setting conversationBlocked: true (no AI responses during verdict)
T+324.002s [MODERATOR] President connecting...
T+324.003s [PLAYER] President connected
T+324.004s [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, moderator])
T+324.005s [CLIENT] Join SFX plays 🔊

# President generates verdict (only time Gemini is used for President)
T+324.100s [PRESIDENT] Constructing full transcript for analysis
T+324.101s [PRESIDENT] Transcript length: 52 messages across all rounds
T+324.102s [PRESIDENT] Prompt: "[SYSTEM]: You are President Dorkesh. Analyze the full debate and decide if Alice is HUMAN or BOT. Deliver your verdict dramatically in max 80 words..."
T+327.500s [GEMINI→moderator] Verdict generated (3.4s latency - long prompt)
T+327.501s [PRESIDENT] Transcript: "I have observed three rounds of debate. Alice, your hesitation on mathematics, your emotional vulnerability discussing fears and dreams, your existential dread about climate change - these reveal genuine human consciousness. Wario, you performed well, but Alice's imperfections betray her humanity. Alice, you are HUMAN. You may escape the simulation."
T+327.502s [CONVERSATION] Added to history
T+327.503s [TTS] Requesting audio (first time generating this verdict)
T+328.400s [TTS] Stream started (0.9s latency)
T+328.401s [WS→CLIENT] AUDIO_STREAM_START (moderator)
T+328.402s [QUEUE] Active speaker: moderator

T+328.450s [AUDIO] "I have observed three rounds of debate..."
T+348.200s [AUDIO] "...You may escape the simulation."
T+348.201s [WS→SERVER] AUDIO_COMPLETE (moderator)
T+348.202s [QUEUE] Active speaker: null
T+348.203s [SYSTEM] Verdict delivered: HUMAN WINS

T+348.300s [WS→CLIENT] Broadcast game state (phase: GAME_OVER, result: 'win')
T+348.301s [CLIENT] Shows EndScreen with "YOU WIN" animation
T+348.302s [CLIENT] Victory sound plays 🎉

# ============================================================
# ALTERNATE ENDING: HUMAN LOSES
# If President determines Alice is a bot
# ============================================================

# [Alternative ending if verdict was LOSE:]
# T+348.203s [SYSTEM] Verdict delivered: HUMAN LOSES (identified as bot)
# T+348.300s [WS→CLIENT] Broadcast game state (result: 'lose')
# T+348.301s [CLIENT] Shows EndScreen with "ELIMINATED" animation
# T+348.302s [CLIENT] Defeat sound plays

# ============================================================
# END OF GAME
# Total Duration: 5 minutes 48 seconds (348s)
# Breakdown:
#   - Call Connecting: 4s
#   - President Intro: 17s (faster with pre-recorded audio)
#   - Round 1 Overlay: 5s
#   - Round 1: 90s
#   - Elimination 1: 12s (voting + reveal, NO chatter)
#   - Round 2 Overlay: 5s
#   - Round 2: 90s
#   - Elimination 2: 12s
#   - Round 3 Overlay: 5s
#   - Round 3: 90s (with President appearance)
#   - President Verdict: 24s
# ============================================================

============================================================
KEY IMPROVEMENTS & EDGE CASES COVERED
============================================================

1. PRESIDENT OPTIMIZATION:
   ✅ President intro uses pre-recorded MP3 (no Gemini latency)
   ✅ President speaks 2-3s faster than before
   ✅ No 5s delay after President intro - immediate Round 1 start
   ✅ President speeches are consistent and reliable

2. SELF-ORGANIZATION REMOVED:
   ✅ No self-organization phase - direct President → Round 1 transition
   ✅ Secret Moderator picked randomly at round start (not player1)
   ✅ Cleaner game flow, less confusion

3. FAST ROUND STARTS:
   ✅ First AI queued DURING overlay (not after)
   ✅ AI speaks 0.5-1s into round (not 3-5s)
   ✅ Overlay and queueing happen in parallel
   ✅ Seamless transition from overlay to debate

4. ELIMINATION FLOW FIXED:
   ✅ Round ends → Voting → Results → Elimination → Next round overlay → Next round starts
   ✅ Secret Moderator comments on elimination WITHIN next round (not between phases)
   ✅ No weird "voting phase chatter"
   ✅ Clean phase transitions

5. EDGE CASES COVERED:
   ✅ Human doesn't respond within 7s - AI comments on silence, asks new question
   ✅ Human interrupts AI (barge-in) - audio stops immediately
   ✅ Text mode typing - works similar to voice barge-in (USER_TYPING_START)
   ✅ Timer expires during AI speech - audio interrupted with buzzer, phase transition
   ✅ Human gets majority votes - GAME OVER (lose), show end screen, reset only
   ✅ Human silent >30s - aggressive callout from Secret Moderator
   ✅ Secret Moderator eliminated - new Secret Moderator selected (remaining AI)
   ✅ Multiple AIs respond simultaneously - dismissal within 1000ms window
   ✅ Queue backlog >3 items - clear entire queue
   ✅ Only 1 AI left in Round 3 - still functions correctly

6. SYSTEM PRIORITIES (refined):
   1. Timer expiration (hard stop, highest priority)
   2. Human barge-in (immediate interrupt)
   3. Direct questions to human (7s deadline, force priority)
   4. Direct questions to AI (force response)
   5. Human silence >30s (trigger aggressive callout)
   6. Queue management (prevent backlog >3)
   7. Simultaneous response dismissal (<1000ms)
   8. Turn rotation (avoid repetition, recent speakers filter)

7. TIMING TARGETS (maintained):
   - President intro: ~15s (pre-recorded, consistent)
   - Round overlay: 5s (visual transition)
   - First AI speaks: 0.5-1s into round (pre-queued)
   - AI turn cycle: ~7.5s (2s latency + 5.5s audio)
   - Round 1: 10-12 exchanges in 90s
   - Round 2: 9-11 exchanges (more intense)
   - Round 3: 6-8 exchanges (only 2 players)
   - Human participation: 3-5 times per round

8. LATENCY BREAKDOWN (unchanged):
   - Gemini API: 0.8-3.4s (avg 1.2s, longer for verdicts)
   - ElevenLabs TTS: 0.85-1.1s (avg 0.95s)
   - Total AI turn latency: ~2.15s
   - Audio playback: 3-8s (avg 5.5s)
   - Full turn cycle: ~7.5s

9. VOTING RULES (critical):
   - **Majority vote eliminates player** (2+ votes in Round 1, 2+ in Round 2, 1+ in Round 3)
   - **Human can be eliminated** - if majority votes for human → GAME OVER (lose)
   - **Tie-breaker**: Human is SAFE in ties (candidates exclude player1)
   - NOTE: Current tie-breaker means human can NEVER be eliminated in a perfect tie
   - This may need reconsideration for game balance
   - After elimination: 10-second reveal countdown → Drop-off SFX → Next round

10. QUEUE RULES (refined):
   - Only 1 active speaker at a time
   - Queue AI responses while someone is speaking
   - If queue >= 3 items, clear entire queue (prevent backlog)
   - 800ms delay after audio ends before next AI turn
   - Dismiss simultaneous responses within 1000ms window
   - Pre-queue first AI DURING overlay for immediate round start
   - Human barge-in clears queue and active speaker immediately
   - Timer expiration interrupts active audio and clears queue

11. CONVERSATION TRACKING:
    - Keep last 8 messages for AI context
    - Full transcript stored for President verdict
    - Recent speakers tracking (last 2) to prevent repetition
    - Last human message time for silence detection
    - Direct question detection with 7s response deadline
    - Named player mention detection for routing

```
