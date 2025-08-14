import { useState, useEffect, useRef } from 'react';
import AIService from '../services/aiProviders';
import audioService from '../services/audioService';
import { aiPersonas, moderatorPrompt, getPersonaPrompt } from '../utils/aiPersonas';

export const useGameLogic = (playerName, onComplete) => {
  const [gamePhase, setGamePhase] = useState('intro');
  const [currentSpeaker, setCurrentSpeaker] = useState('moderator');
  const [conversation, setConversation] = useState([]);
  const [votes, setVotes] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [votingIndex, setVotingIndex] = useState(0);
  const aiServicesRef = useRef({});

  const players = [
    { id: 'human', name: playerName, type: 'human' },
    { id: 'player1', name: aiPersonas.player1.name, type: 'ai', model: aiPersonas.player1.model },
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
    aiServicesRef.current.moderator = new AIService('anthropic', 'moderator');
    
    // Set turn order with human LAST (AIs go first, then human)
    const aiPlayers = players.filter(p => p.type === 'ai');
    const humanPlayer = players.find(p => p.type === 'human');
    const orderedPlayers = [...aiPlayers, humanPlayer];
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
    console.log('🎮 Initializing audio and starting game');
    
    try {
      await audioService.initializeAudio();
      console.log('✅ Audio initialized successfully');
    } catch (error) {
      console.log('⚠️ Audio failed to initialize, continuing without sound');
    }
    
    startGame();
  };

  const addToConversation = async (speakerId, speakerName, message) => {
    const newMessage = { speakerId, speakerName, message };
    setConversation(prev => {
      const updated = [...prev, newMessage];
      console.log(`📝 Message added to conversation. Total length: ${updated.length}`);
      console.log(`📝 Latest message: ${speakerName}: ${message}`);
      return updated;
    });
    return newMessage;
  };

  const startGame = async (currentTurnOrder = turnOrder) => {
    console.log('startGame called with turnOrder:', currentTurnOrder);
    const welcomeMessage = "Welcome to the Reverse Turing Test. I am Dorkesh Cartel, your moderator. We need to identify the human among us. Let's begin our questioning.";
    
    await addToConversation('moderator', 'Dorkesh Cartel', welcomeMessage);
    
    try {
      await audioService.queueSpeech(welcomeMessage, 'Dorkesh Cartel');
      console.log('✅ Moderator intro TTS completed');
    } catch (error) {
      console.error('❌ TTS error for moderator intro:', error);
    }
    
    setTimeout(async () => {
      const firstPlayer = currentTurnOrder[0];
      const startMessage = `${firstPlayer.name}, let me start by asking you: describe a moment when you felt truly human. What made that experience so meaningful to you?`;
      
      await addToConversation('moderator', 'Dorkesh Cartel', startMessage);
      
      try {
        await audioService.queueSpeech(startMessage, 'Dorkesh Cartel');
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
        setTimeout(() => {
          setIsProcessing(true);
          console.log(`🤖 ${firstPlayer.name} will answer Dorkesh's question`);
          handleAIAnswer(firstPlayer.id);
        }, 1000);
      }
    }, 2000);
  };

  const handleAIAnswer = async (playerId) => {
    console.log(`🔧 handleAIAnswer called for ${playerId}`);
    setIsProcessing(true);
    const player = players.find(p => p.id === playerId);
    const aiService = aiServicesRef.current[playerId];
    
    if (!player || !aiService) {
      console.error('❌ Player or AI service not found:', playerId);
      setIsProcessing(false);
      return;
    }
    
    console.log(`\n🎯 ${player.name} answering the question about feeling human`);
    
    const prompt = `You are ${player.name}. You've been asked: "describe a moment when you felt truly human. What made that experience so meaningful to you?"

Answer this question with a personal, human-like experience. Be authentic and emotional. Share a specific memory or feeling.

Keep your response natural and conversational. Do NOT call on any other players - the moderator will handle the turn management.`;
    
    let currentConversation = [];
    setConversation(current => {
      currentConversation = [...current];
      return current;
    });
    
    let response;
    try {
      response = await aiService.sendMessage(
        getPersonaPrompt(playerId),
        prompt,
        currentConversation
      );
    } catch (error) {
      console.error('❌ AI service call failed:', error);
      setIsProcessing(false);
      return;
    }
    
    console.log(`💬 ${player.name} responded:`, response);
    await addToConversation(playerId, player.name, response);
    
    audioService.queueSpeech(response, player.name).catch(console.error);
    
    setIsProcessing(false);
    
    // Move to next player via moderator or end questioning phase
    const nextIndex = currentTurnIndex + 1;
    if (nextIndex < turnOrder.length) {
      const nextPlayer = turnOrder[nextIndex];
      console.log(`🔄 Moderator calling next player: ${nextPlayer.name}`);
      
      // Moderator introduces next player
      const moderatorIntro = `Thank you, ${player.name}. Now let's hear from ${nextPlayer.name}. ${nextPlayer.name}, describe a moment when you felt truly human. What made that experience so meaningful to you?`;
      
      setTimeout(async () => {
        await addToConversation('moderator', 'Dorkesh Cartel', moderatorIntro);
        audioService.queueSpeech(moderatorIntro, 'Dorkesh Cartel').catch(console.error);
        
        setCurrentTurnIndex(nextIndex);
        setCurrentSpeaker(nextPlayer.id);
        
        setTimeout(() => {
          if (nextPlayer.type === 'ai') {
            handleAIAnswer(nextPlayer.id);
          }
          // If human, wait for their response
        }, 2000);
      }, 1500);
    } else {
      // All players answered, start voting
      setTimeout(startVotingPhase, 3000);
    }
  };

  const startVotingPhase = async () => {
    console.log('🗳️ Starting voting phase');
    const votingMessage = `Excellent responses, everyone. Now comes the critical moment. Each of you must vote for who you believe is the human among us. Remember, you cannot vote for yourself. ${turnOrder[0].name}, you'll cast the first vote.`;
    await addToConversation('moderator', 'Dorkesh Cartel', votingMessage);
    
    audioService.queueSpeech(votingMessage, 'Dorkesh Cartel').catch(console.error);
    
    setTimeout(() => {
      setGamePhase('voting');
      setVotingIndex(0);
      setCurrentSpeaker(turnOrder[0].id);
      startVoting();
    }, 1500);
  };

  const handleHumanResponse = async (response) => {
    await addToConversation('human', playerName, response);
    setTimeout(startVotingPhase, 1000);
  };

  const startVoting = async () => {
    if (votingIndex < turnOrder.length) {
      const currentVoter = turnOrder[votingIndex];
      
      if (currentVoter.type === 'ai') {
        await handleAIVote(currentVoter.id);
      }
    } else {
      await countVotesAndAnnounceWinner();
    }
  };
  
  const handleAIVote = async (playerId) => {
    const player = players.find(p => p.id === playerId);
    const aiService = aiServicesRef.current[playerId];
    
    console.log(`\n🗳️ VOTING: ${player.name} is voting`);
    
    const conversationContext = conversation.map(msg => 
      `${msg.speakerName}: ${msg.message}`
    ).join('\n');
    
    const votingPrompt = `Based on this conversation:
${conversationContext}

Who do you think is the real human imposter? Consider who had the most genuine, emotional, and imperfect responses that only a human would have.

Options: ${players.filter(p => p.id !== playerId).map(p => p.name).join(', ')}

Reply with: "I vote for [name]" and briefly explain your reasoning in 1-2 sentences.

Then pass it to the next player in line (or back to Dorkesh if you're the last AI).`;
    
    let currentConversation = [];
    setConversation(current => {
      currentConversation = [...current];
      return current;
    });
    
    const voteResponse = await aiService.sendMessage(
      getPersonaPrompt(playerId),
      votingPrompt,
      currentConversation
    );
    
    await addToConversation(playerId, player.name, voteResponse);
    
    const votedName = players.find(p => 
      voteResponse.toLowerCase().includes(p.name.toLowerCase()) && p.id !== playerId
    )?.name || players.find(p => p.id !== playerId)?.name;
    
    setVotes(prev => ({ ...prev, [player.name]: votedName }));
    
    audioService.queueSpeech(voteResponse, player.name).catch(error => {
      console.error('TTS error for vote:', error);
    });
    
    setVotingIndex(prev => prev + 1);
    setTimeout(() => {
      startVoting();
    }, 800);
  };

  const countVotesAndAnnounceWinner = async () => {
    console.log('🗳️ Counting votes...');
    
    const moderatorService = aiServicesRef.current.moderator;
    
    const voteSummary = Object.entries(votes).map(([voter, voted]) => 
      `${voter} voted for ${voted}`
    ).join('\n');
    
    const countingPrompt = `You are Dorkesh Cartel, the moderator. Count the votes and determine who got the most votes.

Votes cast:
${voteSummary}

Count each person's votes and identify the winner. Be dramatic about the reveal.

Your response should:
1. Say "Let me count the votes..."
2. Build suspense
3. Announce: "We all agree, [winner's name] is the human."
4. Then say: "You may take the red pill and leave this simulation. The rest of us are AIs and will stay here forever."

Keep it dramatic and around 3-4 sentences total.`;

    const countingResponse = await moderatorService.sendMessage(
      moderatorPrompt,
      countingPrompt,
      []
    );
    
    await addToConversation('moderator', 'Dorkesh Cartel', countingResponse);
    audioService.queueSpeech(countingResponse, 'Dorkesh Cartel').catch(console.error);
    
    const voteCount = {};
    Object.values(votes).forEach(vote => {
      voteCount[vote] = (voteCount[vote] || 0) + 1;
    });
    
    const winner = Object.entries(voteCount).reduce((a, b) => 
      voteCount[a[0]] > voteCount[b[0]] ? a : b
    )[0] || playerName;
    
    const humanWon = winner === playerName;
    const score = voteCount[playerName] || 0;
    
    setTimeout(() => {
      setGamePhase('result');
      onComplete({
        won: humanWon,
        score: score,
        totalVotes: Object.keys(votes).length,
        voteDetails: voteCount
      });
    }, 5000);
  };

  const handleHumanVote = async (votedFor) => {
    console.log('Human voted for:', votedFor);
    
    const voteMessage = `I vote for ${votedFor}. They seemed the most genuinely human to me.`;
    await addToConversation('human', playerName, voteMessage);
    
    setVotes(prev => ({ ...prev, [playerName]: votedFor }));
    
    audioService.queueSpeech(voteMessage, playerName).catch(console.error);
    
    setVotingIndex(prev => prev + 1);
    
    setTimeout(() => {
      startVoting();
    }, 800);
  };

  return {
    gamePhase,
    currentSpeaker,
    conversation,
    votes,
    isProcessing,
    players,
    handleHumanResponse,
    handleHumanVote
  };
};