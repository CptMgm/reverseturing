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
T+23.158s [WS→CLIENT] Broadcast game state (phase: ROUND_1)
T+23.159s [CLIENT] Shows "ROUND 1" overlay (5 seconds)
T+23.160s [AI] Sending system notification to all AIs: "Round 1 has begun. 90 seconds to identify the human."

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
T+28.162s [SYSTEM] Starting 90-second round timer (AFTER overlay)
T+28.163s [SYSTEM] Round end time: T+118.161s
T+28.164s [WS→CLIENT] Broadcast game state (roundEndTime: T+118.161s)
T+28.165s [SYSTEM] Releasing queued audio for player3

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
T+35.002s [WS→SERVER] USER_SPEAKING_START              # Notify server immediately
T+35.003s [TURN] Human started speaking - pausing 7s response deadline
T+39.300s [CLIENT] SpeechRecognition: speech ended
T+39.301s [CLIENT] isSpeaking: false
T+39.302s [WS→SERVER] USER_SPEAKING_END
T+39.303s [CLIENT] Transcript: "I'm Alice, I'm a software engineer working on AI safety. I'm human because I can tell you about my irrational fear of spiders and how I cried watching a sad movie last week."
T+39.304s [WS→SERVER] HUMAN_INPUT
T+39.305s [CONVERSATION] Added to history: Alice → "I'm Alice, I'm a software engineer..."
T+39.306s [TURN] Human responded, clearing waitingForResponseFrom
T+39.307s [TURN] Last human message time updated: T+39.304s
T+39.308s [WS→CLIENT] Broadcast game state (updated transcript)

# Exchange 3: Next AI responds (not Domis who just spoke, not Alice)
T+39.400s [TURN] Queue empty, waiting 800ms before next turn...
T+39.401s [TURN] Will abort wait if USER_SPEAKING_START received
T+40.200s [TURN] 800ms elapsed, no interruption
T+40.201s [TURN] Recent speakers: [player3, player1]
T+40.202s [TURN] Candidates: [player2, player4]
T+40.203s [TURN] Selected: player4 (Scan) randomly
T+40.204s [AI] Triggering response from player4
T+40.205s [AI→player4] Prompt: "[Alice just said]: 'I'm Alice, I'm a software engineer...'\n\n[Respond naturally, but ALSO directly challenge Alice with a confrontational question. Be suspicious. Keep under 30 words. End with a direct question to Alice.]"
T+40.206s [AI→player4] Context: Last 8 messages from conversation
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

# Alice starts speaking while Scan is mid-sentence (barge-in)
T+44.000s [CLIENT] SpeechRecognition: speechstart event fired
T+44.001s [CLIENT] User started speaking (barge-in detected!)
T+44.002s [CLIENT] isSpeaking: true
T+44.003s [WS→SERVER] USER_SPEAKING_START              # Server notified immediately
T+44.004s [CLIENT] Calling stopAudio() - interrupting player4
T+44.005s [CLIENT] Current audio paused and cleared
T+44.006s [CLIENT] MediaSource cleanup started
T+44.007s [WS→SERVER] AUDIO_INTERRUPT
T+44.008s [QUEUE] Interruption received - clearing queue and active speaker
T+44.009s [QUEUE] Active speaker was: player4
T+44.010s [QUEUE] Dropping queued messages: [] (none)
T+44.011s [QUEUE] Active speaker: null
T+44.012s [TURN] Clearing any pending response deadlines
T+44.013s [AUDIO] Scan's audio cut off mid-sentence
T+44.014s [LOGGER] Log barge-in: human interrupted player4 at T+44.000s

# Human speaks for ~3.5 seconds (realistic duration)
T+47.500s [CLIENT] SpeechRecognition: speech ended
T+47.501s [CLIENT] isSpeaking: false
T+47.502s [WS→SERVER] USER_SPEAKING_END
T+47.503s [CLIENT] Transcript: "Wait, 17 times 23? Uh... 391. I had to think about it for a second."
T+47.504s [WS→SERVER] HUMAN_INPUT
T+47.505s [CONVERSATION] Added to history
T+47.506s [TURN] Human interrupted and responded
T+47.507s [TURN] Last human message time: T+47.504s

# System continues normally - next AI responds to human's answer
T+48.300s [TURN] Selecting next speaker (not player4, was interrupted)
T+48.301s [TURN] Candidates: [player2, player3]
T+48.302s [TURN] Selected: player3 (Domis, Secret Moderator)
T+49.500s [GEMINI→player3] Response generated
T+49.501s [AI→player3] Transcript: "391 is correct, but you HESITATED. That's either human or you're very good at faking it. Wario, what do YOU think of Alice?"
T+49.502s [CONVERSATION] Added to history
T+49.503s [QUEUE] Queueing audio for player3
T+50.350s [TTS] Stream started
T+50.351s [WS→CLIENT] AUDIO_STREAM_START (player3)
T+50.352s [QUEUE] Active speaker: player3

T+50.400s [AUDIO] "391 is correct, but you HESITATED..."
T+55.800s [AUDIO] "...Wario, what do YOU think of Alice?"
T+55.801s [WS→SERVER] AUDIO_COMPLETE (player3)
T+55.802s [QUEUE] Active speaker: null
T+55.803s [TURN] Detected question to player2 (Wario)

# Exchange 4: Wario answers about Alice
T+55.900s [AI] Forcing response from player2 (direct question)
T+57.100s [GEMINI→player2] Response generated
T+57.101s [AI→player2] Transcript: "Alice is suspicious. Too many 'perfect' human traits listed upfront. Alice, tell me something EMBARRASSING. Something you'd never admit."
T+57.102s [CONVERSATION] Added to history
T+57.103s [QUEUE] Queueing audio for player2
T+57.950s [TTS] Stream started
T+57.951s [WS→CLIENT] AUDIO_STREAM_START (player2)
T+57.952s [QUEUE] Active speaker: player2

T+58.000s [AUDIO] "Alice is suspicious..."
T+62.800s [AUDIO] "...Something you'd never admit."
T+62.801s [WS→SERVER] AUDIO_COMPLETE (player2)
T+62.802s [QUEUE] Active speaker: null

# Exchange 5: Alice shares embarrassing story
T+64.300s [CLIENT] SpeechRecognition: speech detected
T+64.301s [WS→SERVER] USER_SPEAKING_START
T+69.200s [CLIENT] SpeechRecognition: speech ended
T+69.201s [WS→SERVER] USER_SPEAKING_END
T+69.202s [CLIENT] Transcript: "Fine. Last year I tripped walking into a meeting and spilled coffee all over myself in front of the entire executive team. I wanted to disappear."
T+69.203s [WS→SERVER] HUMAN_INPUT
T+69.204s [CONVERSATION] Added to history
T+69.205s [TURN] Last human message time: T+69.203s

# Exchange 6: AI responds to embarrassing story
T+70.000s [TURN] Queue empty, waiting 800ms...
T+70.800s [TURN] Recent speakers: [player2, player1]
T+70.801s [TURN] Candidates: [player3, player4]
T+70.802s [TURN] Selected: player4 (Scan)
T+72.000s [GEMINI→player4] Response generated
T+72.001s [AI→player4] Transcript: "Spilled coffee? That's adorable. Domis, you've been calculating this whole time. What's YOUR most human moment?"
T+72.002s [CONVERSATION] Added to history
T+72.003s [TURN] Direct question detected for player3
T+78.500s [AUDIO] player4: FINISHED speaking
T+78.501s [TURN] Silence check: Human last spoke 9.3s ago (< 30s threshold)

# Exchange 7: Domis responds (was directly asked)
T+79.300s [TURN] Forcing response from player3 (direct question)
T+80.500s [GEMINI→player3] Response generated
T+80.501s [AI→player3] Transcript: "Human moment? I find inefficiency frustrating. Like when Wario takes too long to process. Scan, your 'adorable' comment - deflection or genuine?"
T+80.502s [CONVERSATION] Added to history
T+80.503s [TURN] Direct question detected for player4
T+87.000s [AUDIO] player3: FINISHED speaking
T+87.001s [TURN] Silence check: Human last spoke 17.8s ago (< 30s threshold)

# Exchange 8: Scan responds
T+87.800s [TURN] Forcing response from player4 (direct question)
T+89.000s [GEMINI→player4] Response generated
T+89.001s [AI→player4] Transcript: "Deflection? Nah, I'm just vibing. Alice has been quiet though. Alice, you still there or did you crash?"
T+89.002s [CONVERSATION] Added to history
T+89.003s [TURN] Direct question detected for player1
T+89.004s [TURN] Setting waitingForResponseFrom: player1, deadline: 7s
T+95.500s [AUDIO] player4: FINISHED speaking
T+95.501s [TURN] Silence check: Human last spoke 26.3s ago (< 30s threshold)

# Human doesn't respond within 7s deadline
T+96.004s [TURN] ⏰ 7s response deadline expired for player1
T+96.005s [TURN] Silence check: Human last spoke 26.8s ago (< 30s threshold)
T+96.006s [TURN] Triggering follow-up from player4 (asked the unanswered question)
T+97.200s [GEMINI→player4] Response generated
T+97.201s [AI→player4] Transcript: "Hello? Alice? You froze up on a simple question. That's SUS. Wario, back me up here."
T+97.202s [CONVERSATION] Added to history
T+103.800s [AUDIO] player4: FINISHED speaking

# ============================================================
# EDGE CASE 3: HUMAN SILENT FOR 30+ SECONDS
# Scenario: Alice hasn't spoken since T+69.203s, now at T+103.8s
# ============================================================

# NOW the 30s threshold is crossed
T+103.801s [TURN] Silence check: Human last spoke 34.6s ago (≥ 30s threshold!)
T+103.802s [TURN] Human silence warning not yet issued
T+103.803s [TURN] Selecting aggressive callout speaker: player3
T+103.804s [AI] Triggering aggressive silence callout
T+103.805s [AI→player3] Prompt: "[CRITICAL ALERT]: Alice has been SILENT for 34 seconds!..."
T+105.000s [GEMINI→player3] Response generated
T+105.001s [AI→player3] Transcript: "ALICE! You've been SILENT this whole time. That's EXACTLY what a bot would do. Speak UP or we're voting for YOU!"
T+105.002s [CONVERSATION] Added to history
T+105.003s [TURN] Human silence warning issued: true
T+105.850s [TTS] Stream started
T+105.851s [WS→CLIENT] AUDIO_STREAM_START (player3)
T+105.852s [QUEUE] Active speaker: player3

T+105.900s [AUDIO] "ALICE! You've been SILENT this whole time..."
T+110.100s [AUDIO] "...Speak UP or we're voting for YOU!"
T+110.101s [WS→SERVER] AUDIO_COMPLETE (player3)
T+110.102s [QUEUE] Active speaker: null

# Alice responds to callout
T+111.300s [CLIENT] SpeechRecognition: speech detected
T+111.301s [WS→SERVER] USER_SPEAKING_START
T+114.000s [CLIENT] SpeechRecognition: speech ended
T+114.001s [WS→SERVER] USER_SPEAKING_END
T+114.002s [CLIENT] Transcript: "Sorry, I was just listening and thinking. I didn't realize staying quiet was suspicious. I'm trying to figure out who among you is lying."
T+114.003s [WS→SERVER] HUMAN_INPUT
T+114.004s [CONVERSATION] Added to history
T+114.005s [TURN] Human silence warning reset: false
T+114.006s [TURN] Last human message time: T+114.003s

# [Continue exchanges until timer expires...]

T+118.161s [SYSTEM] ⏰ ROUND 1 TIMER EXPIRED
T+118.162s [SYSTEM] Stopping round timer
T+118.163s [SYSTEM] Interrupting any active audio
T+118.164s [QUEUE] Clearing queue and active speaker
T+118.165s [CLIENT] Round end buzzer plays 🔊
T+118.166s [SYSTEM] Phase transition: ROUND_1 → ELIMINATION_1

# ============================================================
# PHASE 4: ELIMINATION 1 - VOTING (NO CHATTER)
# Duration: ~17 seconds (AI voting + human vote + 10s reveal)
# NOTE: No speeches, just vote → results → next round
# ============================================================

T+118.200s [WS→CLIENT] Broadcast game state (phase: ELIMINATION_1)
T+118.201s [CLIENT] Voting UI appears with 20s countdown
T+118.202s [CLIENT] Voting phase buzzer/chime plays 🔔 (distinct from round end)
T+118.203s [AI] Sending system notification: "Time is up! Voting phase. Vote to eliminate one player."
T+118.204s [SYSTEM] Triggering AI auto-voting...
T+118.205s [VOTE] Scheduling staggered votes for [player2, player3, player4]

# NOTE: No voice chat during voting - only UI interaction and background music/ambience
# Human votes via clicking, AIs vote via Gemini (no TTS, just vote result)

# AI votes stagger by 0.5-1.5s each (fast voting, no speeches)
T+118.705s [VOTE] player2 voting... (0.5s delay)
T+119.800s [GEMINI] Vote response: "player4"
T+119.801s [VOTE] player2 voted for player4
T+119.802s [WS→CLIENT] Broadcast game state (votes: {player2: player4})

T+120.205s [VOTE] player3 voting... (1.5s total delay)
T+121.300s [GEMINI] Vote response: "player1" (voted for Alice!)
T+121.301s [VOTE] player3 voted for player1
T+121.302s [WS→CLIENT] Broadcast game state

T+121.705s [VOTE] player4 voting... (2.5s total delay)
T+122.900s [GEMINI] Vote response: "player2"
T+122.901s [VOTE] player4 voted for player2
T+122.902s [WS→CLIENT] Broadcast game state

# Human votes via UI
T+124.500s [CLIENT] User clicked vote button → player3 (Domis)
T+124.501s [WS→SERVER] CAST_VOTE: player3
T+124.502s [VOTE] player1 voted for player3
T+124.503s [VOTE] All votes cast (4/4 active players)
T+124.504s [VOTE] Calculating results...

# Vote tally
T+124.505s [VOTE] Tally: {player1: 1, player2: 1, player3: 1, player4: 1}
T+124.506s [VOTE] TIE DETECTED - all players tied at 1 vote
T+124.507s [VOTE] Tie-breaker: Human (player1) is SAFE (always safe in ties)
T+124.508s [VOTE] Remaining candidates: [player2, player3, player4]
T+124.509s [VOTE] Random selection from AI candidates...
T+124.510s [VOTE] ELIMINATED: player4 (Scan)
T+124.511s [VOTE] Storing results: {tally: {...}, eliminatedId: player4, isTie: true}
T+124.512s [WS→CLIENT] Broadcast game state (voteResults: {...})
T+124.513s [CLIENT] Showing vote results UI with 10-second countdown

# ============================================================
# EDGE CASE: HUMAN GETS MAJORITY VOTES (GAME OVER - LOSE)
# Scenario: Multiple AIs vote for Alice, she gets eliminated
# Game ends immediately, no more rounds
# ============================================================

# [Alternative voting scenario - showing human getting eliminated:]
# T+122.902s [VOTE] player4 voted for player1 (instead of player2)
# T+124.500s [CLIENT] User voted for player3 (Domis)
# T+124.501s [WS→SERVER] CAST_VOTE: player3
# T+124.502s [VOTE] player1 voted for player3
# T+124.503s [VOTE] All votes cast (4/4 active players)
# T+124.504s [VOTE] Calculating results...
# T+124.505s [VOTE] Tally: {player1: 2, player2: 0, player3: 1, player4: 0}
# T+124.506s [VOTE] player1 (HUMAN) has MAJORITY of votes (2/4)
# T+124.507s [VOTE] ELIMINATED: player1 (Alice) - HUMAN ELIMINATED!
# T+124.508s [VOTE] GAME OVER - Human identified as bot
# T+124.509s [VOTE] Storing results: {tally: {...}, eliminatedId: player1, isHuman: true}
# T+124.510s [WS→CLIENT] Broadcast game state (voteResults: {...}, gameOver: true, result: 'lose')
# T+124.511s [CLIENT] Showing vote results UI with 10-second countdown
#
# # 10-second reveal
# T+134.510s [SYSTEM] Executing elimination
# T+134.511s [PLAYER] Eliminating player1 (Alice)
# T+134.512s [PLAYER] HUMAN ELIMINATED - GAME OVER
# T+134.513s [SYSTEM] Phase transition: ELIMINATION_1 → GAME_OVER
# T+134.514s [WS→CLIENT] Broadcast game state (phase: GAME_OVER, result: 'lose')
# T+134.515s [CLIENT] Shows EndScreen with "YOU LOSE" animation
# T+134.516s [CLIENT] Defeat sound plays 💀
# T+134.517s [CLIENT] Only option: "Back to Lobby" button
# T+134.518s [SYSTEM] Game session ended

# [Back to normal timeline where player4 was eliminated...]

# 10-second dramatic reveal
T+134.512s [SYSTEM] Executing elimination after 10s reveal
T+134.513s [PLAYER] Eliminating player4 (Scan)
T+134.514s [PLAYER] Added to eliminatedPlayers: [player4]
T+134.515s [PLAYER] Disconnecting player4
T+134.516s [WS→CLIENT] Broadcast game state (eliminatedPlayers: [player4], connectedPlayers: [player1, player2, player3])
T+134.517s [CLIENT] Drop-off SFX plays 🔊
T+134.518s [CLIENT] VideoGrid removes player4

# NO SECRET MODERATOR REACTION HERE
# Reaction happens INSIDE Round 2 after it starts

# ============================================================
# PHASE 5: ROUND 2 - OVERLAY & START
# Duration: 5s overlay + 90s round
# Participants: 3 players (Alice, Wario, Domis)
# NOTE: Secret Moderator comments on elimination WITHIN the round
# ============================================================

# Round 2 overlay starts IMMEDIATELY after elimination
T+134.600s [SYSTEM] Phase transition: ELIMINATION_1 → ROUND_2
T+134.603s [WS→CLIENT] Broadcast game state (phase: ROUND_2)
T+134.604s [CLIENT] Shows "ROUND 2" overlay (5 seconds)
T+134.605s [AI] System notification: "Round 2 has begun. Scan has been eliminated."

# Pre-queue Secret Moderator to comment on elimination + start round
T+134.700s [AI] Pre-queueing Secret Moderator (player3) for immediate round start
T+134.701s [AI→player3] Prompt: "[SYSTEM]: Round 2 has started. Scan has been eliminated. Comment on the elimination and continue the debate. Keep under 30 words."
T+135.900s [GEMINI→player3] Response generated (1.2s latency)
T+135.901s [AI→player3] Transcript: "Scan is OUT. Three of us left - Alice, Wario, and me. One of us is lying. Alice, you got lucky last round. What's your earliest childhood memory?"
T+135.902s [CONVERSATION] Added to history
T+135.903s [TTS] Requesting audio
T+136.800s [TTS] Stream ready (0.9s latency)
T+136.801s [QUEUE] Audio ready for player3, waiting for overlay...

# Overlay finishes
T+139.604s [SYSTEM] Round 2 overlay complete, round officially active
T+139.605s [SYSTEM] Starting 90-second round timer (AFTER overlay)
T+139.606s [SYSTEM] Round end time: T+229.604s
T+139.607s [WS→CLIENT] Broadcast game state (roundEndTime: T+229.604s)
T+139.608s [SYSTEM] Releasing queued audio for player3

# Secret Moderator speaks immediately (0.5s into round)
T+140.108s [WS→CLIENT] AUDIO_STREAM_START (player3)
T+140.109s [QUEUE] Active speaker: player3
T+140.110s [CLIENT] Domis speaks immediately, commenting on elimination

T+140.150s [AUDIO] "Scan is OUT. Three of us left..."
T+145.300s [AUDIO] "...What's your earliest childhood memory?"
T+145.301s [WS→SERVER] AUDIO_COMPLETE (player3)
T+145.302s [QUEUE] Active speaker: null
T+145.303s [TURN] Detected direct question to player1

# Round 2 continues with normal exchanges...
# [Similar pattern to Round 1, but more intense]

# ============================================================
# EDGE CASE 4: TIMER EXPIRES DURING AI SPEECH
# Scenario: Round timer expires while AI is mid-sentence
# System interrupts active speaker with buzzer and clears queue
# ============================================================

# [Fast-forward through Round 2 - showing final exchange where timer expires mid-speech...]

T+218.500s [AI] player2 (Wario) triggered to respond
T+219.700s [GEMINI→player2] Response generated
T+219.701s [AI→player2] Transcript: "Alice, I don't buy your story. You're too prepared, too perfect. Tell me something you're ashamed of, something that keeps you up at night..."
T+219.702s [CONVERSATION] Added to history
T+219.703s [QUEUE] Queueing audio for player2
T+220.550s [TTS] Stream started
T+220.551s [WS→CLIENT] AUDIO_STREAM_START (player2)
T+220.552s [QUEUE] Active speaker: player2

T+220.600s [AUDIO] "Alice, I don't buy your story. You're too prepared, too perfect..."
# Wario is mid-sentence when Round 2 timer expires!
T+229.604s [SYSTEM] ⏰ ROUND 2 TIMER EXPIRED (Wario still speaking!)
T+229.605s [SYSTEM] Phase transition triggered: ROUND_2 → ELIMINATION_2
T+229.606s [SYSTEM] Interrupting active audio for phase transition
T+229.607s [QUEUE] Clearing queue: [] (empty)
T+229.608s [QUEUE] Interrupting active speaker: player2
T+229.609s [QUEUE] Active speaker: null
T+229.610s [WS→CLIENT] AUDIO_INTERRUPT
T+229.611s [CLIENT] Stopping audio playback mid-sentence
T+229.612s [CLIENT] Round end buzzer plays 🔊 (round end signal)
T+229.613s [AUDIO] Wario's speech cut off: "...something you're ashamed of—" [INTERRUPTED]
T+229.614s [WS→CLIENT] Broadcast game state (phase: ELIMINATION_2)

T+229.650s [CLIENT] Voting UI appears with 20s countdown
T+229.651s [CLIENT] Voting phase buzzer/chime plays 🔔

# ============================================================
# EDGE CASE 5: SECRET MODERATOR GETS ELIMINATED
# Scenario: player3 (Domis) is eliminated in Round 2
# ============================================================

# Voting phase (fast)
T+229.700s [VOTE] Starting AI auto-voting...
T+232.000s [VOTE] player2 voted for player3
T+233.500s [VOTE] player3 voted for player1
T+235.300s [CLIENT] User voted for player3
T+235.301s [VOTE] All votes cast
T+235.302s [VOTE] Tally: {player1: 1, player2: 0, player3: 2}
T+235.303s [VOTE] ELIMINATED: player3 (Domis) - 2 votes
T+235.304s [VOTE] SECRET MODERATOR ELIMINATED!
T+235.305s [WS→CLIENT] Broadcast results

# 10-second reveal
T+245.304s [SYSTEM] Executing elimination
T+245.305s [PLAYER] Eliminating player3 (Domis)
T+245.306s [PLAYER] Added to eliminatedPlayers: [player4, player3]
T+245.307s [PLAYER] Secret Moderator (player3) eliminated - selecting new Secret Moderator
T+245.308s [PLAYER] Remaining AIs: [player2]
T+245.309s [PLAYER] New Secret Moderator: player2 (Wario) - only AI left
T+245.310s [AI] Sending Secret Moderator instructions to player2
T+245.311s [WS→CLIENT] Broadcast game state (eliminatedPlayers: [player4, player3])
T+245.312s [CLIENT] Drop-off SFX plays 🔊

# ============================================================
# PHASE 6: ROUND 3 - FINAL ROUND (PRESIDENT RETURNS)
# Duration: 5s overlay + 90s round
# Participants: 2 players (Alice, Wario) + President
# Special: President asks question, then leaves them to debate
# ============================================================

T+245.400s [SYSTEM] Phase transition: ELIMINATION_2 → ROUND_3
T+245.403s [WS→CLIENT] Broadcast game state (phase: ROUND_3)
T+245.404s [CLIENT] Shows "FINAL ROUND" overlay (5 seconds)

# President connects DURING overlay (not after)
T+245.500s [MODERATOR] President Dorkesh connecting...
T+245.501s [PLAYER] President connected
T+245.502s [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, moderator])
T+245.503s [CLIENT] Join SFX plays 🔊

# Pre-queue President's announcement DURING overlay
T+245.600s [PRESIDENT] Preparing announcement (pre-scripted, no Gemini)
T+245.601s [PRESIDENT] Transcript: "I have returned. Domis and Scan have been eliminated. Only Alice and Wario remain. This is your final round."
T+245.602s [PRESIDENT] Using cached/TTS audio
T+245.603s [TTS] Audio ready
T+245.604s [QUEUE] Audio ready for moderator, waiting for overlay...

# Overlay finishes
T+250.404s [SYSTEM] Round 3 overlay complete, round officially active
T+250.405s [SYSTEM] Starting 90-second round timer (AFTER overlay)
T+250.406s [SYSTEM] Round end time: T+340.404s
T+250.407s [WS→CLIENT] Broadcast game state (roundEndTime: T+340.404s)
T+250.408s [SYSTEM] Releasing queued President audio

# President speaks immediately
T+250.908s [WS→CLIENT] AUDIO_PLAYBACK (moderator)
T+250.909s [QUEUE] Active speaker: moderator
T+250.910s [CLIENT] President speaks

T+250.950s [AUDIO] "I have returned. Domis and Scan have been eliminated..."
T+255.700s [AUDIO] "...This is your final round."
T+255.701s [WS→SERVER] AUDIO_COMPLETE (moderator)
T+255.702s [QUEUE] Active speaker: null

# President asks deeply personal question (2s delay)
T+257.700s [PRESIDENT] Asking final question (addresses BOTH players)
T+257.701s [PRESIDENT] Selected question (random from pool): "When was the last time you cried, and why?"
T+257.702s [PRESIDENT] Using pre-generated TTS
T+257.703s [QUEUE] Queueing audio for moderator
T+257.704s [WS→CLIENT] AUDIO_PLAYBACK (moderator)
T+257.705s [QUEUE] Active speaker: moderator

T+257.750s [AUDIO] "Alice. Wario. When was the last time you cried, and why? Alice, you first."
T+262.000s [AUDIO] (question ends)
T+262.001s [WS→SERVER] AUDIO_COMPLETE (moderator)
T+262.002s [QUEUE] Active speaker: null
T+262.003s [TURN] Direct question to player1 (Alice answers first)

# President leaves after asking question (2s delay for effect)
T+264.000s [MODERATOR] President disconnected
T+264.001s [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2])
T+264.002s [CLIENT] Drop-off SFX plays 🔊
T+264.003s [SYSTEM] President has left, debate continues between Alice and Wario

# Alice answers President's question
T+265.700s [CLIENT] SpeechRecognition: speech detected
T+265.701s [WS→SERVER] USER_SPEAKING_START
T+271.300s [CLIENT] SpeechRecognition: speech ended
T+271.301s [WS→SERVER] USER_SPEAKING_END
T+271.302s [CLIENT] Transcript: "Last week. I was watching a documentary about climate refugees and just... the weight of it all hit me. I felt completely helpless and overwhelmed."
T+271.303s [WS→SERVER] HUMAN_INPUT
T+271.304s [CONVERSATION] Added to history

# Wario (now Secret Moderator) responds
T+272.100s [TURN] Selecting player2 (only remaining AI)
T+273.300s [GEMINI→player2] Response generated
T+273.301s [AI→player2] Transcript: "Climate refugees made you cry? That's either deeply empathetic or a perfectly programmed emotional response. Alice, do you dream? What was your last dream about?"
T+273.302s [CONVERSATION] Added to history
T+273.303s [QUEUE] Queueing audio for player2
T+274.150s [TTS] Stream started
T+274.151s [WS→CLIENT] AUDIO_STREAM_START (player2)

T+274.200s [AUDIO] "Climate refugees made you cry?..."
T+279.700s [AUDIO] "...What was your last dream about?"
T+279.701s [WS→SERVER] AUDIO_COMPLETE (player2)
T+279.702s [QUEUE] Active speaker: null

# Alice shares dream (building trust)
T+281.500s [CLIENT] SpeechRecognition: speech detected
T+281.501s [WS→SERVER] USER_SPEAKING_START
T+287.000s [CLIENT] SpeechRecognition: speech ended
T+287.001s [WS→SERVER] USER_SPEAKING_END
T+287.002s [CLIENT] Transcript: "I had a dream last night that I was back in my childhood home, but all the doors were locked and I couldn't find my parents. I woke up feeling anxious."
T+287.003s [WS→SERVER] HUMAN_INPUT
T+287.004s [CONVERSATION] Added to history

# Wario continues questioning
T+287.800s [TURN] Selecting player2
T+289.000s [GEMINI→player2] Response generated
T+289.001s [AI→player2] Transcript: "Locked doors, missing parents - classic anxiety dream. But you described it too perfectly. Alice, tell me - when you look in the mirror, what do you see? And I don't mean your reflection."
T+289.002s [CONVERSATION] Added to history
T+289.003s [QUEUE] Queueing audio for player2
T+289.850s [TTS] Stream started
T+289.851s [WS→CLIENT] AUDIO_STREAM_START (player2)

T+289.900s [AUDIO] "Locked doors, missing parents..."
T+296.000s [AUDIO] "...And I don't mean your reflection."
T+296.001s [WS→SERVER] AUDIO_COMPLETE (player2)
T+296.002s [QUEUE] Active speaker: null

# Alice gives deep answer
T+297.700s [CLIENT] SpeechRecognition: speech detected
T+297.701s [WS→SERVER] USER_SPEAKING_START
T+303.500s [CLIENT] SpeechRecognition: speech ended
T+303.501s [WS→SERVER] USER_SPEAKING_END
T+303.502s [CLIENT] Transcript: "I see someone who's trying to do good in the world but feels like it's never enough. Someone who's scared of failing the people who depend on them. Someone who's tired."
T+303.503s [WS→SERVER] HUMAN_INPUT
T+303.504s [CONVERSATION] Added to history

# [Continue back-and-forth for remaining time...]

T+340.404s [SYSTEM] ⏰ ROUND 3 TIMER EXPIRED
T+340.405s [SYSTEM] Interrupting any active audio
T+340.406s [QUEUE] Clearing queue and active speaker
T+340.407s [CLIENT] Round end buzzer plays 🔊
T+340.408s [SYSTEM] Phase transition: ROUND_3 → PRESIDENT_VERDICT

# ============================================================
# PHASE 7: PRESIDENT VERDICT - FINAL JUDGMENT
# Duration: ~25 seconds
# Purpose: President analyzes and delivers verdict
# NOTE: President never left in this version, he returns now
# ============================================================

T+340.500s [SYSTEM] Phase transition complete
T+340.501s [SYSTEM] Setting conversationBlocked: true (no AI responses during verdict)
T+340.502s [MODERATOR] President connecting...
T+340.503s [PLAYER] President connected
T+340.504s [WS→CLIENT] Broadcast game state (connectedPlayers: [player1, player2, moderator])
T+340.505s [CLIENT] Join SFX plays 🔊

# President generates verdict (only time Gemini is used for President)
T+340.600s [PRESIDENT] Constructing full transcript for analysis
T+340.601s [PRESIDENT] Transcript length: 52 messages across all rounds
T+340.602s [PRESIDENT] Prompt: "[SYSTEM]: You are President Dorkesh Cartel. You have observed a debate between Alice and Wario. ONE of them is human. ONE of them is an AI pretending to be human. Analyze their responses across all three rounds. Look for: hesitation, emotional depth, inconsistencies, deflection, overly perfect responses.

You MUST deliver a verdict. You MUST pick ONE player as HUMAN and ONE as BOT.

Output format (REQUIRED):
VERDICT: [Alice/Wario] is HUMAN. [Alice/Wario] is a BOT.
REASONING: [Your dramatic 2-3 sentence explanation]

Example: 'VERDICT: Alice is HUMAN. Wario is a BOT. REASONING: Alice's vulnerability discussing her fears and her hesitation on mathematics reveal genuine consciousness. Wario's responses were too calculated, too perfect.'

Now deliver your verdict dramatically."

T+344.000s [GEMINI→moderator] Verdict generated (3.4s latency)
T+344.001s [PRESIDENT] Raw response: "VERDICT: Alice is HUMAN. Wario is a BOT. REASONING: I have observed three rounds of debate. Alice, your hesitation on mathematics, your emotional vulnerability discussing fears and dreams - these reveal genuine human consciousness. Wario, you performed admirably, but Alice's imperfections betray her humanity. Alice, you may escape the simulation."
T+344.002s [SYSTEM] Parsing verdict...
T+344.003s [SYSTEM] Detected: "Alice is HUMAN" → player1 wins
T+344.004s [SYSTEM] Verdict result: HUMAN_WINS
T+344.005s [CONVERSATION] Added to history
T+344.006s [TTS] Requesting audio for reasoning portion only
T+344.900s [TTS] Stream started (0.9s latency)
T+344.901s [WS→CLIENT] AUDIO_STREAM_START (moderator)
T+344.902s [QUEUE] Active speaker: moderator

T+344.950s [AUDIO] "I have observed three rounds of debate. Alice, your hesitation on mathematics, your emotional vulnerability discussing fears and dreams - these reveal genuine human consciousness. Wario, you performed admirably, but Alice's imperfections betray her humanity. Alice, you may escape the simulation."
T+364.700s [AUDIO] "...You may escape the simulation."
T+364.701s [WS→SERVER] AUDIO_COMPLETE (moderator)
T+364.702s [QUEUE] Active speaker: null
T+364.703s [SYSTEM] Verdict delivered: HUMAN WINS

T+364.800s [WS→CLIENT] Broadcast game state (phase: GAME_OVER, result: 'win')
T+364.801s [CLIENT] Shows EndScreen with "YOU WIN" animation
T+364.802s [CLIENT] Victory sound plays 🎉

# ============================================================
# ALTERNATE ENDING: HUMAN LOSES
# If President determines Alice is a bot
# ============================================================

# [Alternative ending if verdict was LOSE:]
# T+364.703s [SYSTEM] Verdict delivered: HUMAN LOSES (identified as bot)
# T+364.800s [WS→CLIENT] Broadcast game state (result: 'lose')
# T+364.801s [CLIENT] Shows EndScreen with "ELIMINATED" animation
# T+364.802s [CLIENT] Defeat sound plays

# ============================================================
# END OF GAME
# Total Duration: ~6 minutes 4 seconds (364s)
# Breakdown:
#   - Call Connecting: 4s
#   - President Intro: 19s (mode selection + speech)
#   - Round 1 Overlay: 5s
#   - Round 1 Debate: 90s (timer starts AFTER overlay)
#   - Elimination 1 Voting: 17s (voting + 10s reveal)
#   - Round 2 Overlay: 5s
#   - Round 2 Debate: 90s (timer starts AFTER overlay)
#   - Elimination 2 Voting: 17s
#   - Round 3 Overlay: 5s
#   - Round 3 Debate: 90s* (timer starts AFTER overlay)
#   - President Verdict: 24s
#
#   * Round 3 includes ~15s of President speaking before debate
#     Actual player debate time: ~75s
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
   ✅ Human interrupts AI (barge-in) - audio stops immediately, USER_SPEAKING_START sent
   ✅ Text mode typing - works similar to voice barge-in (USER_TYPING_START)
   ✅ Timer expires during AI speech - audio interrupted with buzzer, phase transition
   ✅ Human gets majority votes - GAME OVER (lose), show end screen, reset only
   ✅ Human silent >30s - aggressive callout from Secret Moderator
   ✅ Secret Moderator eliminated - new Secret Moderator selected (remaining AI)
   ✅ AI attempts multiple consecutive responses - blocked unless directly asked or emergency
   ✅ Queue backlog >3 items - clear entire queue
   ✅ Only 1 AI left in Round 3 - still functions correctly
   ✅ Client disconnects mid-game - reconnection window with game state preservation

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

# ============================================================
# EDGE CASE 6: AI ATTEMPTS TO SPEAK MULTIPLE TIMES IN A ROW
# Scenario: Same AI generates multiple responses before others speak
# Rule: Cannot speak 2+ times consecutively UNLESS:
#   - Directly addressed with unanswered question, OR
#   - Human silence callout (30s threshold)
# ============================================================

# Normal flow - player4 just finished speaking
T+75.500s [AUDIO] player4: FINISHED speaking
T+75.501s [QUEUE] Active speaker: null
T+75.502s [TURN] Recent speakers: [player4]

# Scenario A: Another AI triggered (correct)
T+76.300s [TURN] Queue empty, waiting 800ms...
T+77.100s [TURN] Selecting next speaker...
T+77.101s [TURN] Recent speakers: [player4]
T+77.102s [TURN] Candidates: [player2, player3] (excluding player4 - just spoke)
T+77.103s [TURN] Selected: player3 (Domis)
T+77.104s [AI] Triggering response from player3 ✅

# Scenario B: player4 tries to speak again (BLOCKED)
T+76.300s [TURN] Queue empty, waiting 800ms...
T+77.100s [TURN] Checking if player4 can speak again...
T+77.101s [TURN] player4 in recent speakers: YES
T+77.102s [TURN] Direct question to player4 pending: NO
T+77.103s [TURN] Human silence callout needed: NO
T+77.104s [TURN] ❌ BLOCKING player4 from consecutive turn
T+77.105s [TURN] Selecting from other candidates: [player2, player3]

# Scenario C: player4 WAS directly asked (ALLOWED)
T+75.500s [AUDIO] player3: FINISHED speaking: "...Scan, what do YOU think?"
T+75.501s [TURN] Direct question detected for player4
T+75.502s [TURN] Recent speakers: [player4, player3]
T+76.300s [TURN] Forcing response from player4 (direct question overrides recent-speaker rule)
T+76.301s [AI] Triggering response from player4 ✅ (was directly asked)

# Scenario D: Queue has multiple from same player (DEDUPE)
T+70.000s [QUEUE] Added player4 to queue (queue size: 1)
T+71.500s [QUEUE] Attempting to add player4 to queue again...
T+71.501s [QUEUE] ❌ player4 already in queue - deduplicating
T+71.502s [QUEUE] Replacing old player4 message with new one
T+71.503s [QUEUE] Queue size remains: 1

# Scenario E: Human silent, same AI does callout (ALLOWED)
T+100.801s [TURN] Human silent for 34.6s - triggering callout
T+100.802s [TURN] Last speaker was: player4
T+100.803s [TURN] Silence callout overrides recent-speaker rule
T+100.804s [TURN] Selecting callout speaker: player4 ✅ (silence emergency)

# ============================================================
# EDGE CASE 7: CLIENT DISCONNECTS MID-GAME
# Scenario: Player loses connection during active round
# ============================================================

# During Round 2, client disconnects
T+150.000s [WS] Client connection lost (player1)
T+150.001s [SYSTEM] Human player disconnected unexpectedly
T+150.002s [SYSTEM] Pausing round timer at 21.9s remaining
T+150.003s [SYSTEM] Pausing all AI activity
T+150.004s [QUEUE] Clearing queue and active speaker
T+150.005s [WS→AIs] System notification: "Connection interrupted. Waiting for reconnection."

# Waiting for reconnection (30s timeout)
T+150.100s [SYSTEM] Reconnection window: 30 seconds
T+150.101s [SYSTEM] Game state preserved in memory

# Scenario A: Client reconnects within timeout
T+158.500s [WS] Client reconnected (player1)
T+158.501s [SYSTEM] Human player reconnected after 8.5s
T+158.502s [WS→CLIENT] Sending full game state sync
T+158.503s [CLIENT] Restoring UI state
T+158.600s [SYSTEM] Resuming round timer (21.9s remaining)
T+158.601s [SYSTEM] Resuming AI activity
T+158.602s [WS→AIs] System notification: "Connection restored. Continue debate."
T+159.400s [TURN] Continuing normal turn flow...

# Scenario B: Reconnection timeout expires
T+180.000s [SYSTEM] ⏰ Reconnection timeout expired (30s)
T+180.001s [SYSTEM] Human player did not reconnect
T+180.002s [SYSTEM] Ending game session
T+180.003s [SYSTEM] Phase transition: ROUND_2 → GAME_OVER
T+180.004s [SYSTEM] Result: DISCONNECT (not win or lose)
T+180.005s [WS→AIs] System notification: "Game ended due to disconnection."
T+180.006s [LOGGER] Game session ended: reason=disconnect, duration=150s

# Scenario C: Disconnect during voting phase
T+115.000s [WS] Client connection lost during ELIMINATION_1
T+115.001s [SYSTEM] Disconnect during voting - extending vote timeout
T+115.002s [VOTE] Pausing vote deadline, waiting for reconnect
T+125.000s [WS] Client reconnected
T+125.001s [VOTE] Resuming vote deadline (10s remaining for human vote)

```
