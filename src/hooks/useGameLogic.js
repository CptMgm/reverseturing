import { useState, useEffect, useRef } from 'react';
import AIService from '../services/aiProviders';
import audioService from '../services/audioService';
import dailyService from '../services/dailyService';
import { aiPersonas, moderatorPrompt, getPersonaPrompt } from '../utils/aiPersonas';

export const useGameLogic = (playerName, onComplete) => {
  const [gamePhase, setGamePhase] = useState('intro');
  const [currentSpeaker, setCurrentSpeaker] = useState('moderator');
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [votingIndex, setVotingIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState("describe a moment when you felt truly human. What made that experience so meaningful to you?");
  const maxRounds = 3;
  const aiServicesRef = useRef({});
  const votingIndexRef = useRef(0);
  const timingMetrics = useRef({});
  const messageTimestamps = useRef({}); // Track when messages were added
  const lastSpeechEndTime = useRef(null); // Track when last speech ended

  const players = [
    { id: 'moderator', name: 'Dorkesh Cartel', type: 'moderator', model: 'google' },
    { id: 'human', name: playerName, type: 'human' },
    // Only 3 AI players (player1/Elongated Muskett is disabled)
    { id: 'player2', name: aiPersonas.player2.name, type: 'ai', model: aiPersonas.player2.model },
    { id: 'player3', name: aiPersonas.player3.name, type: 'ai', model: aiPersonas.player3.model },
    { id: 'player4', name: aiPersonas.player4.name, type: 'ai', model: aiPersonas.player4.model }
  ];

  useEffect(() => {
    console.log('🔧 Initializing players:', players);
    
    // Initialize AI services for each player
    players.forEach(player => {
      if (player.type === 'ai') {
        console.log(`🤖 Creating AI service for ${player.name} with model: ${player.model}`);
        aiServicesRef.current[player.id] = new AIService(player.model, player.id);
      }
    });

    // Add moderator AI service
    aiServicesRef.current.moderator = new AIService('google', 'moderator');

    // Set turn order with human as CHARACTER 2 (second position)
    // Turn order: AI (player2) → Human → AI (player3) → AI (player4)
    const aiPlayers = players.filter(p => p.type === 'ai');
    const humanPlayer = players.find(p => p.type === 'human');
    const orderedPlayers = [
      aiPlayers[0], // player2 (Wario) goes first
      humanPlayer,  // Human is Character 2 (second)
      aiPlayers[1], // player3 (Domis) goes third
      aiPlayers[2]  // player4 (Scan) goes fourth
    ];
    console.log('🎯 Turn order set:', orderedPlayers);
    setTurnOrder(orderedPlayers);
  }, []);
  
  // Start game when turn order is set
  useEffect(() => {
    if (turnOrder.length > 0 && conversation.length === 0) {
      console.log('Starting game with turn order:', turnOrder);
      initializeAudioAndStart();
    }
  }, [turnOrder, conversation.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeAudioAndStart = async () => {
    console.log('🎮 Initializing audio and Daily room');

    try {
      // Initialize audio
      await audioService.initializeAudio();
      console.log('✅ Audio initialized successfully');
    } catch (error) {
      console.log('⚠️ Audio failed to initialize, continuing without sound');
    }

    try {
      // Create and join Daily room
      await dailyService.createAndJoinRoom();
      console.log('✅ Daily room joined successfully');
    } catch (error) {
      console.error('❌ Daily room failed to initialize:', error);
      console.log('⚠️ Continuing without Daily room');
    }

    startGame();
  };

  const addToConversation = async (speakerId, speakerName, message, shouldAnimate = false) => {
    const timestamp = Date.now();

    // Log time since last speech
    if (lastSpeechEndTime.current) {
      const timeSinceLastSpeech = timestamp - lastSpeechEndTime.current;
      console.log(`⏱️ [INTERACTION GAP] ${(timeSinceLastSpeech / 1000).toFixed(2)}s since last person finished speaking`);
    }

    const newMessage = {
      speakerId,
      speakerName,
      message,
      timestamp,
      shouldAnimate // Pass through the shouldAnimate parameter
    };
    setConversation(prev => {
      const updated = [...prev, newMessage];
      console.log(`📝 Message added to conversation. Total length: ${updated.length}`);
      console.log(`📝 Latest message: ${speakerName}: ${message}`);
      return updated;
    });

    messageTimestamps.current[speakerId] = timestamp;
    return newMessage;
  };

  // Helper to enable animation for the last message
  const enableLastMessageAnimation = () => {
    setConversation(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        shouldAnimate: true
      };
      return updated;
    });
  };

  const startGame = async (currentTurnOrder = turnOrder) => {
    console.log('🎮 ===== START GAME =====');
    console.log('Turn order:', currentTurnOrder);

    const welcomeMessage = "Welcome to the Reverse Turing Test. I am Dorkesh Cartel, your moderator. We need to identify the human among us. Let's begin our questioning.";

    console.log('📝 Adding welcome message to conversation...');
    await addToConversation('moderator', 'Dorkesh Cartel', welcomeMessage);
    console.log('✅ Welcome message added');

    try {
      console.log('🎤 Queueing moderator intro TTS...');
      await audioService.queueSpeech(welcomeMessage, 'Dorkesh Cartel');
      lastSpeechEndTime.current = Date.now();
      console.log('✅ Moderator intro TTS completed');
    } catch (error) {
      console.error('❌ TTS error for moderator intro:', error);
    }

    console.log('⏰ Setting 1 second timeout for first question...');
    setTimeout(async () => {
      console.log('⏰ Timeout fired, preparing first question...');
      const firstPlayer = currentTurnOrder[0];
      const startMessage = `${firstPlayer.name}, let me start by asking you: describe a moment when you felt truly human. What made that experience so meaningful to you?`;

      console.log('📝 Adding start message to conversation...');
      await addToConversation('moderator', 'Dorkesh Cartel', startMessage);
      console.log('✅ Start message added');

      try {
        console.log('🎤 Queueing moderator start message TTS...');
        await audioService.queueSpeech(startMessage, 'Dorkesh Cartel');
        lastSpeechEndTime.current = Date.now();
        console.log('✅ Moderator start message TTS completed');
      } catch (error) {
        console.error('❌ TTS error for moderator start:', error);
      }

      console.log('🎮 Starting questioning phase...');
      console.log('👤 First player to answer Dorkesh:', firstPlayer.name);
      setGamePhase('questioning');
      setCurrentTurnIndex(0);
      setCurrentSpeaker(firstPlayer.id);

      if (firstPlayer.type === 'ai') {
        console.log('⏰ Setting 500ms timeout for AI answer...');
        setTimeout(() => {
          setIsProcessing(true);
          console.log(`🤖 ${firstPlayer.name} will answer Dorkesh's question`);
          handleAIAnswer(firstPlayer.id);
        }, 500);
      } else {
        console.log('👤 First player is human, waiting for input');
      }
    }, 1000);
  };

  const handleAIAnswer = async (playerId) => {
    const turnStartTime = performance.now();
    console.log(`⏱️ [TIMING] ========== START ${playerId} turn ==========`);
    console.log(`🔧 handleAIAnswer called for ${playerId}`);
    setIsProcessing(true);
    const player = players.find(p => p.id === playerId);
    const aiService = aiServicesRef.current[playerId];

    if (!player || !aiService) {
      console.error('❌ Player or AI service not found:', playerId);
      setIsProcessing(false);
      return;
    }

    console.log(`\n🎯 ${player.name} answering question: ${currentQuestion.substring(0, 100)}...`);

    // Get current conversation for context
    let currentConversation = [];
    setConversation(current => {
      currentConversation = [...current];
      return current;
    });

    const prompt = `You are ${player.name}. Answer this question that was just asked to you: "${currentQuestion}"

Share a personal, specific memory with genuine emotion. Be authentic and vulnerable.

IMPORTANT: Only answer the question. Do NOT mention other players, hand over the turn, or reference the moderator. Just give your answer.`;
    
    let response;
    const apiStart = performance.now();
    try {
      response = await aiService.sendMessage(
        getPersonaPrompt(playerId),
        prompt,
        currentConversation
      );
      const apiEnd = performance.now();
      console.log(`⏱️ [TIMING] AI API call: ${(apiEnd - apiStart).toFixed(0)}ms`);
    } catch (error) {
      console.error('❌ AI service call failed:', error);
      setIsProcessing(false);
      return;
    }

    console.log(`💬 ${player.name} responded:`, response);
    await addToConversation(playerId, player.name, response, false); // Don't animate yet

    // Wait for AI speech to finish before enabling typing animation
    const ttsStart = performance.now();
    try {
      await audioService.queueSpeech(response, player.name);
      lastSpeechEndTime.current = Date.now();

      // Enable typing animation AFTER speech completes
      enableLastMessageAnimation();

      const ttsEnd = performance.now();
      console.log(`⏱️ [TIMING] TTS playback: ${(ttsEnd - ttsStart).toFixed(0)}ms`);
      console.log(`✅ ${player.name} finished speaking`);
    } catch (error) {
      console.error(`❌ TTS error for ${player.name}:`, error);
    }

    const turnEnd = performance.now();
    console.log(`⏱️ [TIMING] ========== TOTAL ${player.name} turn: ${(turnEnd - turnStartTime).toFixed(0)}ms (${((turnEnd - turnStartTime)/1000).toFixed(1)}s) ==========\n`);

    setIsProcessing(false);

    // Move to next player via moderator or end questioning phase
    // Find current player's index in turnOrder
    const currentIndex = turnOrder.findIndex(p => p.id === playerId);
    const nextIndex = currentIndex + 1;
    console.log(`🔄 Current player ${player.name} at index ${currentIndex}, nextIndex: ${nextIndex}`);

    if (nextIndex < turnOrder.length) {
      const nextPlayer = turnOrder[nextIndex];
      console.log(`🔄 Moderator calling next player: ${nextPlayer.name}`);

      // Moderator introduces next player
      const moderatorIntro = `Thank you, ${player.name}. Now let's hear from ${nextPlayer.name}. ${nextPlayer.name}, ${currentQuestion}`;

      setTimeout(async () => {
        await addToConversation('moderator', 'Dorkesh Cartel', moderatorIntro);

        // Wait for moderator to finish speaking before next player
        try {
          await audioService.queueSpeech(moderatorIntro, 'Dorkesh Cartel');
          lastSpeechEndTime.current = Date.now();
          console.log('✅ Moderator finished speaking');
        } catch (error) {
          console.error('❌ Moderator TTS error:', error);
        }

        setCurrentTurnIndex(nextIndex);
        setCurrentSpeaker(nextPlayer.id);

        setTimeout(() => {
          if (nextPlayer.type === 'ai') {
            handleAIAnswer(nextPlayer.id);
          }
          // If human, wait for their response
        }, 800);
      }, 600);
    } else {
      // All players answered, show pause screen
      console.log('✅ All players have answered, showing interlude');
      setTimeout(showInterlude, 2000);
    }
  };

  const showInterlude = async () => {
    console.log(`⏸️ Showing interlude screen (Round ${currentRound} of ${maxRounds})`);
    const interludeMessage = `Excellent responses, everyone. That concludes round ${currentRound}.`;
    await addToConversation('moderator', 'Dorkesh Cartel', interludeMessage);

    // Set interlude phase immediately, don't wait for audio
    setGamePhase('interlude');

    // Play audio in background without blocking
    audioService.queueSpeech(interludeMessage, 'Dorkesh Cartel').catch(error => {
      console.error('❌ TTS error for interlude:', error);
    });
  };

  const startAnotherRound = async () => {
    console.log(`🔄 Starting round ${currentRound + 1} of ${maxRounds}`);
    setCurrentRound(currentRound + 1);
    setGamePhase('questioning');
    setCurrentTurnIndex(0);

    // Dorkesh asks a new question
    const newQuestions = [
      "What's something you've done that you're genuinely proud of?",
      "Describe a time when you felt completely misunderstood. What happened?",
      "Tell me about a moment that changed how you see the world.",
      "What's the most irrational fear you have, and why do you think you have it?",
      "Describe a decision you made that you still question today."
    ];

    const randomQuestion = newQuestions[Math.floor(Math.random() * newQuestions.length)];
    setCurrentQuestion(randomQuestion.toLowerCase()); // Update current question
    const firstPlayer = turnOrder[0];
    const nextQuestionMessage = `Let's dig deeper. ${firstPlayer.name}, ${randomQuestion}`;

    await addToConversation('moderator', 'Dorkesh Cartel', nextQuestionMessage);

    try {
      await audioService.queueSpeech(nextQuestionMessage, 'Dorkesh Cartel');
      lastSpeechEndTime.current = Date.now();
      console.log('✅ Moderator finished asking next question');
    } catch (error) {
      console.error('❌ TTS error for next question:', error);
    }

    setCurrentSpeaker(firstPlayer.id);

    setTimeout(() => {
      if (firstPlayer.type === 'ai') {
        handleAIAnswer(firstPlayer.id);
      }
    }, 800);
  };

  const startVotingPhase = async () => {
    console.log('\n🗳️ ========== STARTING VOTING PHASE ==========');
    console.log('Turn order:', turnOrder.map(p => p.name));

    const votingMessage = `Now comes the critical moment. Each of you must vote for who you believe is the human among us. Remember, you cannot vote for yourself. ${turnOrder[0].name}, you'll cast the first vote.`;
    await addToConversation('moderator', 'Dorkesh Cartel', votingMessage);

    // Set voting phase immediately, don't wait for audio
    console.log('Setting gamePhase to voting, votingIndex to 0');
    setGamePhase('voting');
    setVotingIndex(0);
    votingIndexRef.current = 0;
    setCurrentSpeaker(turnOrder[0].id);

    // Play audio in background without blocking
    audioService.queueSpeech(votingMessage, 'Dorkesh Cartel').catch(error => {
      console.error('❌ TTS error for voting intro:', error);
    });

    console.log('⏰ Scheduling startVoting in 1 second...');
    setTimeout(() => {
      console.log('⏰ Timeout fired, calling startVoting');
      startVoting();
    }, 1000);
  };

  const handleHumanResponse = async (response) => {
    console.log('👤 Human response received:', response);
    await addToConversation('human', playerName, response);

    // Continue to next player in turn order (same logic as AI)
    // Find human's index in turnOrder
    const currentIndex = turnOrder.findIndex(p => p.type === 'human');
    const nextIndex = currentIndex + 1;
    console.log(`🔄 Human at index ${currentIndex}, nextIndex: ${nextIndex}, turnOrder.length: ${turnOrder.length}`);

    if (nextIndex < turnOrder.length) {
      const nextPlayer = turnOrder[nextIndex];
      console.log(`🔄 Moderator calling next player after human: ${nextPlayer.name}`);

      // Moderator introduces next player
      const moderatorIntro = `Thank you, ${playerName}. Now let's hear from ${nextPlayer.name}. ${nextPlayer.name}, ${currentQuestion}`;

      setTimeout(async () => {
        await addToConversation('moderator', 'Dorkesh Cartel', moderatorIntro);

        // Wait for moderator to finish speaking
        try {
          await audioService.queueSpeech(moderatorIntro, 'Dorkesh Cartel');
          console.log('✅ Moderator finished speaking after human');
        } catch (error) {
          console.error('❌ Moderator TTS error:', error);
        }

        setCurrentTurnIndex(nextIndex);
        setCurrentSpeaker(nextPlayer.id);

        setTimeout(() => {
          if (nextPlayer.type === 'ai') {
            handleAIAnswer(nextPlayer.id);
          }
          // If human, wait for their response (though human shouldn't be next twice)
        }, 800);
      }, 600);
    } else {
      // All players answered, show pause screen
      console.log('🗳️ All players answered, showing interlude');
      setTimeout(showInterlude, 2000);
    }
  };

  const startVoting = async () => {
    const currentIndex = votingIndexRef.current;
    console.log(`\n📊 startVoting called - votingIndex: ${currentIndex}, turnOrder.length: ${turnOrder.length}`);

    if (currentIndex < turnOrder.length) {
      const currentVoter = turnOrder[currentIndex];
      console.log(`👤 Current voter: ${currentVoter.name} (${currentVoter.type})`);

      // Set the current speaker so UI knows who's voting
      setCurrentSpeaker(currentVoter.id);

      if (currentVoter.type === 'ai') {
        console.log(`🤖 Calling handleAIVote for ${currentVoter.id}`);
        // Don't await - handleAIVote will call startVoting when done
        handleAIVote(currentVoter.id);
      } else {
        console.log(`👨 Waiting for human to vote via UI - VotingPanel should appear`);
      }
    } else {
      console.log(`✅ All votes cast, counting votes...`);
      await countVotesAndAnnounceWinner();
    }
  };
  
  const handleAIVote = async (playerId) => {
    const player = players.find(p => p.id === playerId);
    const aiService = aiServicesRef.current[playerId];

    console.log(`\n🗳️ ========== VOTING: ${player.name} ==========`);
    console.log(`Current votingIndex: ${votingIndexRef.current}`);

    // Filter conversation to only include ANSWERS to the questioning round
    // Exclude moderator messages and voting-related messages
    const playerAnswers = conversation.filter(msg =>
      msg.speakerId !== 'moderator' &&
      !msg.message.toLowerCase().includes('vote') &&
      !msg.message.toLowerCase().includes('describe a moment') &&
      !msg.message.toLowerCase().includes('felt truly human') &&
      !msg.message.toLowerCase().includes('critical moment') &&
      !msg.message.toLowerCase().includes('questioning round')
    );

    const conversationContext = playerAnswers.map(msg =>
      `${msg.speakerName}: ${msg.message}`
    ).join('\n\n');

    const availableOptions = players.filter(p => p.id !== playerId).map(p => p.name);

    const votingPrompt = `You must vote NOW. Here are the responses from the questioning round:

${conversationContext}

Vote for who you think is the REAL HUMAN based on these responses.

STRICT FORMAT - Reply EXACTLY like this:
"I vote for [name]. [One sentence explaining why]"

Where [name] must be one of: ${availableOptions.join(', ')}

Example: "I vote for Domis Hassoiboi. Their chess story had genuine frustration."

Keep your explanation to ONE sentence (10-15 words max).`;

    console.log(`📝 Sending voting prompt to ${player.name}...`);

    let voteResponse;
    try {
      // Use minimal persona, empty history to prevent conversation
      voteResponse = await aiService.sendMessage(
        `You are ${player.name}. You are concise and follow instructions exactly.`,
        votingPrompt,
        [] // Empty conversation history
      );
    } catch (error) {
      console.error(`❌ Voting error for ${player.name}:`, error);
      // Fallback to random vote
      const randomOption = availableOptions[Math.floor(Math.random() * availableOptions.length)];
      voteResponse = `I vote for ${randomOption}.`;
    }

    console.log(`✅ ${player.name} voted: ${voteResponse}`);
    await addToConversation(playerId, player.name, voteResponse);

    // Wait for AI to finish speaking their vote before moving on
    try {
      await audioService.queueSpeech(voteResponse, player.name);
      lastSpeechEndTime.current = Date.now();
      console.log(`✅ ${player.name} finished speaking their vote`);
    } catch (error) {
      console.error('TTS error for vote:', error);
    }

    // Move to next voter
    console.log(`➡️ Moving to next voter, incrementing votingIndex from ${votingIndexRef.current}`);
    votingIndexRef.current += 1;
    setVotingIndex(votingIndexRef.current);
    console.log(`📍 New votingIndex: ${votingIndexRef.current}`);

    // Small delay then trigger next vote
    setTimeout(() => {
      console.log('⏰ Calling startVoting after delay');
      startVoting();
    }, 600);
  };

  const countVotesAndAnnounceWinner = async () => {
    console.log('🗳️ ========== COUNTING VOTES ==========');

    const moderatorService = aiServicesRef.current.moderator;

    // Get all voting-related messages from conversation
    const votingMessages = conversation.filter(msg =>
      msg.message.toLowerCase().includes('vote') &&
      msg.speakerId !== 'moderator'
    );

    console.log('📊 Voting messages:', votingMessages.length);
    votingMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg.speakerName}: "${msg.message.substring(0, 80)}..."`);
    });

    // Parse votes using regex
    const parsedVotes = {};

    votingMessages.forEach(msg => {
      const voter = msg.speakerName;
      console.log(`\n🔍 Parsing vote from ${voter}: "${msg.message}"`);

      // Find all player names mentioned in the message
      const mentionedNames = [];
      players.forEach(p => {
        if (p.id === msg.speakerId) return; // Skip self-mentions

        // Check for exact name match (case-insensitive)
        const namePattern = new RegExp(p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = msg.message.match(namePattern);

        if (matches) {
          // Count occurrences
          matches.forEach(() => mentionedNames.push(p.name));
          console.log(`  - Found "${p.name}" ${matches.length} time(s)`);
        }
      });

      if (mentionedNames.length === 0) {
        console.warn(`  ⚠️ No valid names found in vote from ${voter}`);
        return;
      }

      // If multiple names mentioned, use the most common or last mentioned
      let votedFor;

      if (mentionedNames.length === 1) {
        votedFor = mentionedNames[0];
      } else {
        // Count occurrences
        const nameCounts = {};
        mentionedNames.forEach(name => {
          nameCounts[name] = (nameCounts[name] || 0) + 1;
        });

        // Find max count
        const maxCount = Math.max(...Object.values(nameCounts));
        const mostMentioned = Object.entries(nameCounts)
          .filter(([_, count]) => count === maxCount)
          .map(([name, _]) => name);

        if (mostMentioned.length === 1) {
          // Single most mentioned name
          votedFor = mostMentioned[0];
          console.log(`  ✅ Most mentioned (${maxCount}x): ${votedFor}`);
        } else {
          // Tie - use last mentioned
          votedFor = mentionedNames[mentionedNames.length - 1];
          console.log(`  ✅ Tie, using last mentioned: ${votedFor}`);
        }
      }

      parsedVotes[voter] = votedFor;
      console.log(`  ✅ ${voter} voted for: ${votedFor}`);
    });

    console.log('\n📊 Final parsed votes:', parsedVotes);
    console.log('📊 Total votes parsed:', Object.keys(parsedVotes).length);
    Object.entries(parsedVotes).forEach(([voter, votedFor]) => {
      console.log(`  ${voter} → ${votedFor}`);
    });

    // Count votes
    const voteCount = {};
    Object.values(parsedVotes).forEach(votedFor => {
      voteCount[votedFor] = (voteCount[votedFor] || 0) + 1;
      console.log(`  Adding vote for ${votedFor}, new count: ${voteCount[votedFor]}`);
    });

    console.log('\n📊 Final vote count:', voteCount);
    console.log('📊 Vote breakdown:');
    Object.entries(voteCount).forEach(([name, count]) => {
      console.log(`  ${name}: ${count} vote${count !== 1 ? 's' : ''}`);
    });

    // Check for ties
    const maxVotes = Math.max(...Object.values(voteCount));
    const topCandidates = Object.entries(voteCount).filter(([_, count]) => count === maxVotes);

    let winner;
    let tiebreaker = null;

    if (topCandidates.length > 1) {
      // TIE! Dorkesh must decide
      console.log('⚖️ TIE DETECTED! Dorkesh will cast the deciding vote');

      const tiedNames = topCandidates.map(([name, _]) => name);
      const tiebreakerPrompt = `The votes are tied! Here are the vote counts:
${Object.entries(voteCount).map(([name, count]) => `${name}: ${count} vote${count !== 1 ? 's' : ''}`).join('\n')}

${tiedNames.join(' and ')} are tied with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''} each.

As the moderator, YOU must cast the deciding vote. Review the conversation and pick who you think is the human.

STRICT FORMAT - Reply EXACTLY like this:
"As the tiebreaker, I vote for [name]. [One sentence why]"

Where [name] must be one of: ${tiedNames.join(', ')}`;

      const tiebreakerResponse = await moderatorService.sendMessage(
        moderatorPrompt,
        tiebreakerPrompt,
        []
      );

      console.log('🗳️ Dorkesh tiebreaker vote:', tiebreakerResponse);
      await addToConversation('moderator', 'Dorkesh Cartel', tiebreakerResponse);

      // Wait for Dorkesh to speak the tiebreaker
      try {
        await audioService.queueSpeech(tiebreakerResponse, 'Dorkesh Cartel');
        lastSpeechEndTime.current = Date.now();
        console.log('✅ Dorkesh finished speaking tiebreaker vote');
      } catch (error) {
        console.error('❌ TTS error for tiebreaker:', error);
      }

      // Parse Dorkesh's vote
      const tiebreakerMatch = tiebreakerResponse.match(/vote for ([^.]+)/i);
      if (tiebreakerMatch) {
        const dorkeshVote = tiebreakerMatch[1].trim();
        // Find which tied candidate Dorkesh voted for
        winner = tiedNames.find(name =>
          dorkeshVote.toLowerCase().includes(name.toLowerCase())
        ) || tiedNames[0];
        tiebreaker = dorkeshVote;
        console.log(`✅ Dorkesh broke the tie, voting for: ${winner}`);
      } else {
        // Fallback to first tied candidate
        winner = tiedNames[0];
        console.log('⚠️ Could not parse Dorkesh vote, using first tied candidate');
      }

      // After tiebreaker, announce final result immediately
      const humanWon = winner === playerName;
      const score = voteCount[playerName] || 0;

      const tiebreakerAnnouncement = `The tiebreaker has been cast. With my deciding vote, ${winner} is identified as the human. ${humanWon ? `${winner}, you may take the red pill and exit this simulation. The rest of you will remain for further processing.` : `However, ${winner} is actually an AI. The human has successfully evaded detection.`}`;

      await addToConversation('moderator', 'Dorkesh Cartel', tiebreakerAnnouncement);

      try {
        await audioService.queueSpeech(tiebreakerAnnouncement, 'Dorkesh Cartel');
        lastSpeechEndTime.current = Date.now();
        console.log('✅ Dorkesh finished final tiebreaker announcement');
      } catch (error) {
        console.error('❌ TTS error for tiebreaker announcement:', error);
      }

      // Go directly to result screen
      setTimeout(() => {
        console.log('🎬 Transitioning to result screen after tiebreaker');
        setGamePhase('result');
        onComplete({
          won: humanWon,
          score: score,
          totalVotes: Object.keys(parsedVotes).length,
          voteDetails: voteCount
        });
      }, 2000);

      return; // Exit early, don't do the regular announcement
    } else {
      // No tie, clear winner
      winner = Object.entries(voteCount).length > 0
        ? Object.entries(voteCount).reduce((a, b) =>
            voteCount[a[0]] > voteCount[b[0]] ? a : b
          )[0]
        : playerName;
    }

    const humanWon = winner === playerName;
    const score = voteCount[playerName] || 0;

    console.log(`🏆 Winner: ${winner}, Human won: ${humanWon}, Score: ${score}`);

    // Create templated announcement (don't trust LLM to announce factual results correctly)
    const winnerVotes = voteCount[winner] || 0;
    const countingResponse = `The votes are in... ${Object.entries(voteCount).map(([name, count]) => `${name} received ${count} vote${count !== 1 ? 's' : ''}`).join(', ')}. With ${winnerVotes} vote${winnerVotes !== 1 ? 's' : ''}, the collective has determined: ${winner} is the human.`;

    await addToConversation('moderator', 'Dorkesh Cartel', countingResponse);

    // Wait for Dorkesh to finish speaking before showing results
    try {
      await audioService.queueSpeech(countingResponse, 'Dorkesh Cartel');
      lastSpeechEndTime.current = Date.now();
      console.log('✅ Dorkesh finished announcing winner');
    } catch (error) {
      console.error('❌ TTS error for winner announcement:', error);
    }

    // Wait a bit after speech finishes for dramatic effect
    setTimeout(() => {
      console.log('🎬 Transitioning to result screen');
      setGamePhase('result');
      onComplete({
        won: humanWon,
        score: score,
        totalVotes: Object.keys(parsedVotes).length,
        voteDetails: voteCount
      });
    }, 2000);
  };

  const handleHumanVote = async (votedFor) => {
    console.log('Human voted for:', votedFor);

    const voteMessage = `I vote for ${votedFor}. They seemed the most genuinely human to me.`;
    await addToConversation('human', playerName, voteMessage);

    // Wait for human to finish speaking their vote before moving on
    try {
      await audioService.queueSpeech(voteMessage, playerName);
      lastSpeechEndTime.current = Date.now();
      console.log(`✅ ${playerName} finished speaking their vote`);
    } catch (error) {
      console.error('TTS error for human vote:', error);
    }

    votingIndexRef.current += 1;
    setVotingIndex(votingIndexRef.current);

    setTimeout(() => {
      startVoting();
    }, 600);
  };

  return {
    gamePhase,
    currentSpeaker,
    conversation,
    isProcessing,
    players,
    currentRound,
    maxRounds,
    handleHumanResponse,
    handleHumanVote,
    startVotingPhase,
    startAnotherRound
  };
};