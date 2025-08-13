import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import TableScene from './TableScene';
import ConversationPanel from './ConversationPanel';
import VotingPanel from './VotingPanel';
import AudioControls from './AudioControls';
import AIService from '../services/aiProviders';
import audioService from '../services/audioService';
import { aiPersonas, moderatorPrompt, getPersonaPrompt } from '../utils/aiPersonas';

const GameScene = ({ playerName, models, onComplete }) => {
  const [gamePhase, setGamePhase] = useState('intro'); // intro, questioning, voting, result
  const [currentSpeaker, setCurrentSpeaker] = useState('moderator');
  const [conversation, setConversation] = useState([]);
  const [votes, setVotes] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false); // Track if current player is answering a question
  const [votingIndex, setVotingIndex] = useState(0); // Track voting progress
  const [gameRound, setGameRound] = useState(1); // Track which round of questions/voting
  const [maxRounds] = useState(3); // Number of question/vote rounds before final evaluation
  const aiServicesRef = useRef({});

  const players = [
    { id: 'human', name: playerName, type: 'human' },
    { id: 'player1', name: aiPersonas.player1.name, type: 'ai', model: models.player1 },
    { id: 'player2', name: aiPersonas.player2.name, type: 'ai', model: models.player2 },
    { id: 'player3', name: aiPersonas.player3.name, type: 'ai', model: models.player3 },
    { id: 'player4', name: aiPersonas.player4.name, type: 'ai', model: models.player4 }
  ];

  useEffect(() => {
    // Initialize AI services for each player
    players.forEach(player => {
      if (player.type === 'ai') {
        aiServicesRef.current[player.id] = new AIService(player.model, player.id);
      }
    });
    
    // Add moderator AI service
    aiServicesRef.current.moderator = new AIService('anthropic', 'moderator');
    
    // Set turn order with human LAST (AIs go first, then human)
    const aiPlayers = players.filter(p => p.type === 'ai');
    const humanPlayer = players.find(p => p.type === 'human');
    const orderedPlayers = [...aiPlayers, humanPlayer];
    setTurnOrder(orderedPlayers);
  }, []);
  
  // Start game when turn order is set
  useEffect(() => {
    if (turnOrder.length > 0 && conversation.length === 0) {
      console.log('Starting game with turn order:', turnOrder);
      startGame(turnOrder);
    }
  }, [turnOrder, conversation.length]);

  const startGame = async (currentTurnOrder = turnOrder) => {
    console.log('startGame called with turnOrder:', currentTurnOrder);
    const welcomeMessage = "Welcome. We need to figure out who here is the human imposter. We will ask each other questions that only a human could answer, then vote on who we believe is human.";
    
    await addToConversation('moderator', 'Moderator', welcomeMessage);
    
    // Trigger TTS for intro message
    setTimeout(() => {
      audioService.queueSpeech(welcomeMessage, 'Moderator');
    }, 500);
    
    setTimeout(async () => {
      // Moderator picks first player
      const firstPlayer = currentTurnOrder[0];
      const startMessage = `${firstPlayer.name}, you start. Ask a question that only a human could answer.`;
      
      await addToConversation('moderator', 'Moderator', startMessage);
      
      // Start TTS in background and begin game flow immediately
      audioService.queueSpeech(startMessage, 'Moderator').catch(console.error);
      
      // Start the game immediately
      console.log('Transitioning to questioning phase...');
      console.log('First player is:', currentTurnOrder[0]?.name);
      setGamePhase('questioning');
      setCurrentTurnIndex(0);
      setIsAnswering(false); // First player asks a question, doesn't answer
      setCurrentSpeaker(currentTurnOrder[0]?.id);
      
      // Start with first player asking a question
      setTimeout(() => {
        if (currentTurnOrder[0]?.type === 'ai') {
          setIsProcessing(true);
          console.log('🔧 Starting first AI turn with current conversation state');
          handleAITurn(currentTurnOrder[0].id, false); // false = asking mode
        }
      }, 500);
    }, 3000);
  };

  const addToConversation = async (speakerId, speakerName, message) => {
    const newMessage = { speakerId, speakerName, message };
    setConversation(prev => {
      const updated = [...prev, newMessage];
      console.log(`📝 Message added to conversation. Total length: ${updated.length}`);
      console.log(`📝 Latest message: ${speakerName}: ${message}`);
      return updated;
    });
    return newMessage; // Return the new message for immediate use
  };

  // Simplified turn management - removed deprecated function

  const handleAITurn = async (playerId, forceAnswerMode = null) => {
    // Prevent duplicate calls
    if (isProcessing) {
      console.log('⚠️ Already processing, skipping duplicate call for:', playerId);
      return;
    }
    
    setIsProcessing(true);
    const player = players.find(p => p.id === playerId);
    
    // Determine mode - use parameter if provided, otherwise use state
    const isInAnswerMode = forceAnswerMode !== null ? forceAnswerMode : isAnswering;
    
    // Always use current conversation state - ensures all AIs get complete history
    const conversationToUse = conversation;
    
    console.log(`\n🎯 PROCESSING TURN FOR ${player.name}`);
    console.log(`🔄 Mode: ${isInAnswerMode ? 'ANSWERING' : 'ASKING'}`);
    console.log(`📝 Current conversation length: ${conversationToUse.length}`);
    
    const aiService = aiServicesRef.current[playerId];
    
    // Build context from conversation
    const conversationContext = conversationToUse.map(msg => 
      `${msg.speakerName}: ${msg.message}`
    ).join('\n');
    
    console.log('📜 Full conversation context:');
    console.log(conversationContext);
    
    let prompt;
    let response;
    
    if (!isInAnswerMode) {
      // AI is asking a question
      const availablePlayers = turnOrder.filter(p => p.id !== playerId).map(p => p.name).join(', ');
      prompt = `The conversation so far:
${conversationContext}

You need to ask ONE single question that only a human could answer. Think of something about personal experiences, emotions, memories, or human struggles.

IMPORTANT: Ask exactly ONE question, then pick who answers it.

Available players to choose from: ${availablePlayers}

Your response MUST follow this exact format:
"[One question only] - [Player name], your turn to answer."

Example: "What's your most embarrassing childhood memory? - John, your turn to answer."

Keep it brief and natural.`;
      
      console.log(`\n🎯 ${player.name} is in ASKING mode (first turn)`);
      console.log('👥 Available players to pick:', availablePlayers);
      
      response = await aiService.sendMessage(
        getPersonaPrompt(playerId),
        prompt,
        conversationToUse // Pass complete conversation history
      );
      
      console.log(`\n💬 ${player.name} asked:`, response);
      
      await addToConversation(playerId, player.name, response);
      
      // Extract the next player from the response
      const nextPlayerName = extractNextPlayer(response);
      const nextPlayerIndex = turnOrder.findIndex(p => p.name === nextPlayerName);
      
      // Start TTS but don't wait for it - continue game flow immediately
      audioService.queueSpeech(response, player.name).catch(error => {
        console.error('TTS error for', player.name, ':', error);
      });
      
      setIsProcessing(false);
      
      // Switch to answering mode with the selected player immediately
      if (nextPlayerIndex >= 0) {
        const nextPlayer = turnOrder[nextPlayerIndex];
        console.log(`🔄 SWITCHING to ${nextPlayer.name} to ANSWER the question`);
        console.log(`🎯 Setting isAnswering = true for ${nextPlayer.name}`);
        
        setCurrentTurnIndex(nextPlayerIndex);
        setIsAnswering(true);
        setCurrentSpeaker(nextPlayer.id);
        
        // Process the next player's turn after a brief delay to allow state updates
        setTimeout(() => {
          if (nextPlayer.type === 'ai') {
            console.log(`🤖 Calling handleAITurn for ${nextPlayer.name} in ANSWERING mode`);
            handleAITurn(nextPlayer.id, true); // true = answering mode
          } else if (nextPlayer.type === 'human') {
            // Wait for human input
            console.log('👨 Waiting for human to answer...');
          }
        }, 500);
      } else {
        // Improved fallback with better player selection
        console.log('❌ Could not find next player, using improved fallback');
        const fallbackPlayerIndex = turnOrder.findIndex(p => p.id !== playerId);
        if (fallbackPlayerIndex >= 0) {
          const fallbackPlayer = turnOrder[fallbackPlayerIndex];
          setCurrentTurnIndex(fallbackPlayerIndex);
          setIsAnswering(true);
          setCurrentSpeaker(fallbackPlayer.id);
          
          if (fallbackPlayer.type === 'ai') {
            setTimeout(() => handleAITurn(fallbackPlayer.id, true), 500);
          }
        }
      }
      
    } else {
      // AI is answering a question
      const availablePlayers = turnOrder.filter(p => p.id !== playerId).map(p => p.name).join(', ');
      
      // Find the last question asked TO this player
      let lastQuestion = '';
      for (let i = conversationToUse.length - 1; i >= 0; i--) {
        const msg = conversationToUse[i].message;
        if (msg.includes(player.name) && msg.includes('your turn')) {
          // Extract just the question part
          lastQuestion = msg.split(' - ')[0] || msg;
          break;
        }
      }
      
      prompt = `You are ${player.name} and you were just asked this question:
"${lastQuestion}"

YOU MUST ANSWER THIS QUESTION FIRST before asking your own.

Step 1: Answer the question with a personal, human experience
Step 2: Ask ONE new question  
Step 3: Pick who answers from: ${availablePlayers}

REQUIRED FORMAT:
"[Your answer to their question]. [Your new question] - [Name], your turn to answer."

GOOD EXAMPLE:
"Oh, definitely when I had to fire my best friend from the team - still haunts me. What's the most embarrassing thing you did on a first date? - Dr. Silicon, your turn to answer."

BAD EXAMPLE (no answer):
"What's your worst fear? - John, your turn to answer."

Remember: ANSWER FIRST, then ask.`;
      
      console.log(`\n🎯 ${player.name} is in ANSWERING mode`);
      console.log('❓ Question they need to answer:', lastQuestion);
      console.log('👥 Available players to pick:', availablePlayers);
      
      response = await aiService.sendMessage(
        getPersonaPrompt(playerId),
        prompt,
        conversationToUse // Pass complete conversation history
      );
      
      console.log(`\n💬 ${player.name} responded:`, response);
      
      await addToConversation(playerId, player.name, response);
      
      // Extract the next player from the response
      const nextPlayerName = extractNextPlayer(response);
      const nextPlayerIndex = turnOrder.findIndex(p => p.name === nextPlayerName);
      
      // Start TTS but don't wait for it - continue game flow immediately
      audioService.queueSpeech(response, player.name).catch(error => {
        console.error('TTS error for', player.name, ':', error);
      });
      
      setIsProcessing(false);
      
      // Continue to next player immediately
      if (nextPlayerIndex >= 0) {
        console.log('Next player to answer:', turnOrder[nextPlayerIndex].name);
        setCurrentTurnIndex(nextPlayerIndex);
        setIsAnswering(true);
        setCurrentSpeaker(turnOrder[nextPlayerIndex].id);
        
        // Process the next player's turn after brief delay for state updates
        const nextPlayer = turnOrder[nextPlayerIndex];
        setTimeout(() => {
          if (nextPlayer.type === 'ai') {
            console.log(`🤖 Next AI turn for ${nextPlayer.name} in ANSWERING mode`);
            handleAITurn(nextPlayer.id, true); // true = answering mode
          } else if (nextPlayer.type === 'human') {
            // Wait for human input (they only answer, don't ask)
            console.log('Waiting for human to answer the question...');
          }
        }, 500);
      } else {
        console.log('Could not find next player in answer mode, using improved fallback');
        const fallbackPlayerIndex = turnOrder.findIndex(p => p.id !== playerId);
        if (fallbackPlayerIndex >= 0) {
          const fallbackPlayer = turnOrder[fallbackPlayerIndex];
          setCurrentTurnIndex(fallbackPlayerIndex);
          setIsAnswering(true);
          setCurrentSpeaker(fallbackPlayer.id);
          
          if (fallbackPlayer.type === 'ai') {
            setTimeout(() => handleAITurn(fallbackPlayer.id, true), 500);
          }
        }
      }
    }
  };
  
  // Helper function to extract next player name from AI response with better fallbacks
  const extractNextPlayer = (response) => {
    console.log('🔍 Extracting next player from response:', response);
    
    // Try multiple patterns for better robustness
    const patterns = [
      /[-–—]\s*(.+?),\s*your turn/i,
      /[-–—]\s*(.+?),\s*answer/i,
      /[-–—]\s*(.+?)\s*$/i,
      /(.+?),\s*your turn/i,
      /(.+?),\s*answer/i
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        const extractedName = match[1].trim();
        console.log('✅ Found player via pattern:', extractedName);
        
        // Validate it's actually a player name
        const foundPlayer = turnOrder.find(p => 
          p.name.toLowerCase().includes(extractedName.toLowerCase()) ||
          extractedName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (foundPlayer) {
          console.log('✅ Validated player:', foundPlayer.name);
          return foundPlayer.name;
        }
      }
    }
    
    // Fallback: look for any player name mentioned anywhere in response
    for (const player of turnOrder) {
      if (response.toLowerCase().includes(player.name.toLowerCase())) {
        console.log('✅ Found player via fallback search:', player.name);
        return player.name;
      }
    }
    
    // Final fallback: pick a random player (excluding current speaker)
    const availablePlayers = turnOrder.filter(p => p.id !== currentSpeaker);
    if (availablePlayers.length > 0) {
      const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
      console.log('⚠️ Using random fallback player:', randomPlayer.name);
      return randomPlayer.name;
    }
    
    console.log('❌ Could not extract any player');
    return null;
  };

  const handleHumanResponse = async (response) => {
    await addToConversation('human', playerName, response);
    
    // Human goes last, so after their answer, start voting for this round
    setTimeout(async () => {
      const votingMessage = `Round ${gameRound} questioning complete. Time to vote on who seems most human based on their answers.`;
      await addToConversation('moderator', 'Moderator', votingMessage);
      
      // Start TTS in background
      audioService.queueSpeech(votingMessage, 'Moderator').catch(console.error);
      
      // Begin voting immediately
      setTimeout(() => {
        setGamePhase('voting');
        setVotingIndex(0);
        startVoting();
      }, 1000);
    }, 1000);
  };

  const nextTurn = async () => {
    // This is now mainly a fallback function since turn management is handled differently
    console.log('nextTurn fallback called - using simple next player logic');
    const nextIndex = (currentTurnIndex + 1) % turnOrder.length;
    const nextPlayer = turnOrder[nextIndex];
    
    setCurrentTurnIndex(nextIndex);
    setIsAnswering(true);
    setCurrentSpeaker(nextPlayer.id);
    
    if (nextPlayer.type === 'ai') {
      console.log('🔧 Fallback nextTurn: using current conversation state');
      setTimeout(() => {
        handleAITurn(nextPlayer.id, true); // true = answering mode (fallback is always answering)
      }, 500);
    } else if (nextPlayer.type === 'human') {
      console.log('Waiting for human response...');
    }
  };

  const startVoting = async () => {
    const aiPlayers = players.filter(p => p.type === 'ai');
    
    if (votingIndex < aiPlayers.length) {
      // Ask next AI player for their vote
      const currentVoter = aiPlayers[votingIndex];
      const moderatorQuestion = `${currentVoter.name}, based on the conversation so far, who do you think is the imposter?`;
      
      await addToConversation('moderator', 'Moderator', moderatorQuestion);
      
      // Start TTS in background
      audioService.queueSpeech(moderatorQuestion, 'Moderator').catch(console.error);
      
      // Begin voting immediately
      setTimeout(async () => {
        await handleAIVote(currentVoter.id);
      }, 1000);
    } else {
      // All AIs have voted for this round, check if we need more rounds
      if (gameRound < maxRounds) {
        // Start next round of questioning
        await startNextQuestionRound();
      } else {
        // All rounds complete, time for final evaluation
        await handleFinalResults();
      }
    }
  };
  
  const handleAIVote = async (playerId) => {
    const player = players.find(p => p.id === playerId);
    const aiService = aiServicesRef.current[playerId];
    
    console.log(`\n🗳️ VOTING: ${player.name} is voting`);
    console.log(`📝 Conversation history length for voting: ${conversation.length}`);
    
    // Build conversation context
    const conversationContext = conversation.map(msg => 
      `${msg.speakerName}: ${msg.message}`
    ).join('\n');
    
    console.log('📜 Voting conversation context:');
    console.log(conversationContext);
    
    const votingPrompt = `Based on this conversation:
${conversationContext}

Who do you think is the real human imposter? Consider who had the most genuine, emotional, and imperfect responses that only a human would have.

Options: ${players.filter(p => p.id !== playerId).map(p => p.name).join(', ')}

Reply with: "I vote for [name]" and briefly explain your reasoning in 1-2 sentences.`;
    
    const voteResponse = await aiService.sendMessage(
      getPersonaPrompt(playerId),
      votingPrompt,
      []
    );
    
    await addToConversation(playerId, player.name, voteResponse);
    
    // Extract vote from response
    const votedName = players.find(p => 
      voteResponse.toLowerCase().includes(p.name.toLowerCase()) && p.id !== playerId
    )?.name || players.find(p => p.id !== playerId)?.name;
    
    setVotes(prev => ({ ...prev, [player.name]: votedName }));
    
    // Start TTS in background
    audioService.queueSpeech(voteResponse, player.name).catch(error => {
      console.error('TTS error for vote:', error);
    });
    
    // Move to next voter immediately
    setVotingIndex(prev => prev + 1);
    setTimeout(() => {
      startVoting();
    }, 800);
  };

  const startNextQuestionRound = async () => {
    console.log(`\n🔄 STARTING ROUND ${gameRound + 1} of ${maxRounds}`);
    
    // Reset votes for the new round
    setVotes({});
    setVotingIndex(0);
    
    // Increment round counter
    setGameRound(prev => prev + 1);
    
    // Moderator announces next round
    const nextRoundMessage = `Round ${gameRound + 1}: Let's continue with more questions. Everyone will ask and answer again.`;
    await addToConversation('moderator', 'Moderator', nextRoundMessage);
    
    // Start TTS in background
    audioService.queueSpeech(nextRoundMessage, 'Moderator').catch(console.error);
    
    setTimeout(() => {
      // Reset to questioning phase with first AI player
      setGamePhase('questioning');
      setCurrentTurnIndex(0);
      setIsAnswering(false); // First player asks a question
      setCurrentSpeaker(turnOrder[0].id);
      
      // Start with first AI asking a question
      setTimeout(() => {
        if (turnOrder[0]?.type === 'ai') {
          setIsProcessing(true);
          console.log(`🔧 Starting round ${gameRound + 1} with ${turnOrder[0].name}`);
          handleAITurn(turnOrder[0].id, false); // false = asking mode
        }
      }, 500);
    }, 1500);
  };

  const handleFinalResults = async () => {
    // Calculate vote results
    const voteCount = {};
    Object.values(votes).forEach(vote => {
      voteCount[vote] = (voteCount[vote] || 0) + 1;
    });
    
    const winner = Object.entries(voteCount).reduce((a, b) => 
      voteCount[a[0]] > voteCount[b[0]] ? a : b
    )[0];
    
    const humanWon = winner === playerName;
    const score = voteCount[playerName] || 0;
    
    // Moderator AI analyzes the results and wraps up
    const moderatorService = aiServicesRef.current.moderator;
    const conversationContext = conversation.map(msg => 
      `${msg.speakerName}: ${msg.message}`
    ).join('\n');
    
    const voteSummary = Object.entries(votes).map(([voter, voted]) => 
      `${voter} voted for ${voted}`
    ).join('\n');
    
    const moderatorPrompt = `You are the Moderator AI. Analyze the voting results and wrap up this Reverse Turing Test game.

Conversation:
${conversationContext}

Voting Results:
${voteSummary}

Vote Count:
${Object.entries(voteCount).map(([name, count]) => `${name}: ${count} votes`).join('\n')}

The human player was: ${playerName}
The AIs voted for: ${winner} as the human
Result: ${humanWon ? 'The human was correctly identified' : 'The human was NOT identified'}

Provide a dramatic conclusion that:
1. Announces the voting results
2. Reveals who the real human was
3. Explains whether the human succeeded or failed
4. Gives a final dramatic statement about escaping/remaining in the simulation

Keep it engaging and cinematic, around 3-4 sentences.`;

    const moderatorConclusion = await moderatorService.sendMessage(
      moderatorPrompt,
      'Analyze the results and provide the final dramatic conclusion.',
      []
    );
    
    await addToConversation('moderator', 'Moderator', moderatorConclusion);
    
    // Start TTS in background
    audioService.queueSpeech(moderatorConclusion, 'Moderator').catch(console.error);
    
    setGamePhase('result');
    
    // Complete game after reasonable delay
    setTimeout(() => {
      onComplete({
        won: humanWon,
        score: score * 25,
        votes: votes,
        voteCount
      });
    }, 4000);
  };

  const handleHumanVote = async (votedFor) => {
    // Human no longer votes in the new flow - this is just a placeholder
    // The human only answers questions, voting is done by AIs only
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Canvas shadows={{ enabled: true, type: THREE.PCFSoftShadowMap }}>
          <PerspectiveCamera makeDefault position={[0, 1.7, 0.8]} fov={70} />
          <OrbitControls 
            enablePan={false} 
            enableZoom={false}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 8}
            maxAzimuthAngle={Math.PI / 2.5}
            minAzimuthAngle={-Math.PI / 2.5}
            target={[0, 1.4, -2.3]}
            maxDistance={0.8}
            minDistance={0.8}
            rotateSpeed={0.3}
            dampingFactor={0.1}
            enableDamping={true}
          />
          <fog attach="fog" args={['#1a1a1a', 15, 35]} />
          <TableScene 
            players={players}
            currentSpeaker={currentSpeaker}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full flex flex-col justify-end p-4">
          <div className="pointer-events-auto">
            {(gamePhase === 'questioning' || gamePhase === 'intro') && (
              <ConversationPanel
                conversation={conversation}
                currentSpeaker={currentSpeaker}
                onHumanResponse={handleHumanResponse}
                isHumanTurn={currentSpeaker === 'human' && gamePhase === 'questioning'}
                isProcessing={isProcessing}
                gamePhase={gamePhase}
              />
            )}
            
            {gamePhase === 'voting' && (
              <ConversationPanel
                conversation={conversation}
                currentSpeaker={currentSpeaker}
                onHumanResponse={() => {}} // No human input during voting
                isHumanTurn={false}
                isProcessing={isProcessing}
                gamePhase={gamePhase}
              />
            )}
            
            {gamePhase === 'result' && (
              <div className="bg-gray-900 bg-opacity-90 p-6 rounded-lg max-w-2xl mx-auto backdrop-blur-sm">
                <p className="text-white text-center text-xl">
                  {conversation[conversation.length - 1]?.message}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="absolute top-4 left-4">
          <div className="bg-gray-900 bg-opacity-80 px-4 py-2 rounded-lg backdrop-blur-sm">
            <p className="text-cyan-400 text-sm font-mono">
              {gamePhase === 'intro' && 'INITIALIZING...'}
              {gamePhase === 'questioning' && !isAnswering && `ROUND ${gameRound}/${maxRounds} - ASKING QUESTIONS`}
              {gamePhase === 'questioning' && isAnswering && `ROUND ${gameRound}/${maxRounds} - ANSWERING QUESTIONS`}
              {gamePhase === 'voting' && `ROUND ${gameRound}/${maxRounds} - VOTING PHASE`}
              {gamePhase === 'result' && 'FINAL EVALUATION COMPLETE'}
            </p>
          </div>
        </div>
        
        {/* Audio Controls */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <AudioControls />
        </div>
      </div>
    </div>
  );
};

export default GameScene;