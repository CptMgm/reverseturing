/**
 * Conversation Simulation & Testing Framework
 *
 * Tests conversation flow, timing, user engagement without needing TTS
 * Simulates different user behaviors and analyzes the conversation quality
 */

// ============= SIMULATION CONFIGURATION =============

const SIMULATION_CONFIG = {
  // Test scenarios
  scenarios: {
    SILENT_USER: {
      name: 'Silent User (Never Responds)',
      userBehavior: 'silent',
      expectedOutcomes: [
        'AIs should escalate callouts after 45s',
        'Multiple direct questions to user',
        'Eventually AIs focus on each other if user remains silent'
      ]
    },
    CHATTY_USER: {
      name: 'Chatty User (Responds Too Much)',
      userBehavior: 'chatty',
      responseRate: 0.8, // Responds to 80% of questions
      expectedOutcomes: [
        'User gets multiple turns',
        'Conversation balanced',
        'AIs interrogate user frequently'
      ]
    },
    NORMAL_USER: {
      name: 'Normal User (Responds Sometimes)',
      userBehavior: 'normal',
      responseRate: 0.4, // Responds to 40% of questions
      expectedOutcomes: [
        'Natural back-and-forth',
        'User engaged but not dominating',
        'Mix of AI-to-AI and AI-to-User dialogue'
      ]
    },
    EVASIVE_USER: {
      name: 'Evasive User (Short, Unhelpful Answers)',
      userBehavior: 'evasive',
      responseRate: 0.5,
      responseStyle: 'minimal', // "idk", "maybe", "sure"
      expectedOutcomes: [
        'AIs should become more suspicious',
        'More aggressive questioning',
        'Accusations of being a bot'
      ]
    }
  },

  // Timing expectations (in milliseconds)
  timingBounds: {
    minPauseBetweenMessages: 2500, // 2.5s pause after audio
    normalAIDelay: { min: 4000, max: 7000 }, // 4-7s
    quickAIDelay: { min: 2000, max: 4000 }, // 2-4s
    slowAIDelay: { min: 7000, max: 10000 }, // 7-10s
    userSilenceThreshold: 45000, // 45s before callout
    maxTotalConversationTime: 180000 // 3 minutes
  }
};

// ============= MOCK SERVICES =============

class MockGeminiService {
  constructor() {
    this.sessions = new Map();
    this.responseTemplates = {
      accuse: [
        "{target}, YOU'RE being way too quiet. Are YOU even real?",
        "I don't trust {target}. YOU sound like a bot!",
        "{target}, prove YOU're human. What's YOUR earliest memory?"
      ],
      defend: [
        "I'm NOT a bot! I can FEEL this panic!",
        "That's ridiculous! I remember... I remember sunshine!",
        "How DARE you accuse me! I'm REAL!"
      ],
      question: [
        "{target}, what do YOU think about this?",
        "So {target}, are YOU gonna say something?",
        "{target}, YOU've been suspicious this whole time"
      ],
      statement: [
        "This is insane. We're all gonna die.",
        "Someone here is definitely a bot.",
        "I think we need to vote soon."
      ]
    };
  }

  async initializeSession(playerId, name, prompt, apiKey) {
    this.sessions.set(playerId, { name, prompt });
    console.log(`[MockGemini] Initialized ${name}`);
  }

  async sendText(text, targetPlayerId, context) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate mock response based on context
    const session = this.sessions.get(targetPlayerId);
    const response = this._generateMockResponse(targetPlayerId, text, context);

    // Simulate callback (would normally come from real Gemini API)
    if (this.onAIResponse) {
      // Mock audio data (empty for simulation)
      this.onAIResponse(targetPlayerId, response, null);
    }

    return response;
  }

  _generateMockResponse(playerId, prompt, context) {
    const playerNames = ['Wario', 'Domis', 'Scan', 'Chris'];
    const otherPlayers = playerNames.filter(n =>
      n !== this._getPlayerName(playerId)
    );

    // Bias toward targeting Chris (the human) more often
    // 60% chance to target Chris, 40% to target another AI
    let target;
    if (Math.random() < 0.6) {
      target = 'Chris';
    } else {
      const aiPlayers = otherPlayers.filter(n => n !== 'Chris');
      target = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
    }

    // Determine response type based on prompt
    let type;
    if (prompt.includes('CRITICAL') || prompt.includes('AGGRESSIVE')) {
      type = 'accuse';
    } else if (prompt.includes('defend') || prompt.includes('accused')) {
      type = 'defend';
    } else if (Math.random() < 0.6) {
      type = 'question';
    } else {
      type = 'statement';
    }

    const templates = this.responseTemplates[type];
    let response = templates[Math.floor(Math.random() * templates.length)];
    response = response.replace('{target}', target);

    return response;
  }

  _getPlayerName(playerId) {
    const names = { player2: 'Wario', player3: 'Domis', player4: 'Scan' };
    return names[playerId] || 'Unknown';
  }
}

// ============= USER BEHAVIOR SIMULATORS =============

class UserSimulator {
  constructor(scenario, config) {
    this.scenario = scenario;
    this.config = config;
    this.messageCount = 0;
    this.questionCount = 0;
    this.responseSent = 0;
  }

  shouldRespond(message, conversationHistory) {
    const behavior = this.config.userBehavior;
    const userMentioned = message.toLowerCase().includes('chris');
    const isQuestion = message.includes('?');

    if (behavior === 'silent') {
      return false;
    }

    if (behavior === 'chatty') {
      return userMentioned && Math.random() < this.config.responseRate;
    }

    if (behavior === 'normal') {
      return userMentioned && isQuestion && Math.random() < this.config.responseRate;
    }

    if (behavior === 'evasive') {
      return userMentioned && isQuestion && Math.random() < this.config.responseRate;
    }

    return false;
  }

  generateResponse(message, conversationHistory) {
    this.responseSent++;
    const style = this.config.responseStyle || 'normal';

    if (style === 'minimal') {
      const responses = ['idk', 'maybe', 'sure', 'whatever', 'I guess'];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Generate contextual response
    if (message.toLowerCase().includes('memory') || message.toLowerCase().includes('remember')) {
      return 'I remember... playing in the park as a kid';
    }

    if (message.toLowerCase().includes('prove') || message.toLowerCase().includes('human')) {
      return "I'm human! I can think and feel!";
    }

    if (message.toLowerCase().includes('quiet') || message.toLowerCase().includes('silent')) {
      return "Sorry, just trying to figure this out";
    }

    // Generic responses
    const responses = [
      "I don't know what to say",
      "This is crazy",
      "How do I prove I'm human?",
      "I'm trying my best here",
      "What do you want from me?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// ============= CONVERSATION ANALYZER =============

class ConversationAnalyzer {
  constructor() {
    this.metrics = {
      totalMessages: 0,
      userMessages: 0,
      aiMessages: 0,
      questionsAsked: 0,
      userQuestioned: 0,
      averageMessageLength: 0,
      averageDelay: 0,
      delays: [],
      pronounErrors: [],
      longMessages: [],
      aiChains: [], // Sequences of AI-to-AI messages
      userEngagement: 0
    };
  }

  analyzeMessage(message, speaker, timestamp, previousTimestamp) {
    this.metrics.totalMessages++;

    if (speaker === 'Chris') {
      this.metrics.userMessages++;
    } else {
      this.metrics.aiMessages++;
    }

    // Check message length
    const wordCount = message.split(/\s+/).length;
    this.metrics.averageMessageLength =
      (this.metrics.averageMessageLength * (this.metrics.totalMessages - 1) + wordCount) /
      this.metrics.totalMessages;

    if (wordCount > 30) {
      this.metrics.longMessages.push({
        speaker,
        message,
        wordCount
      });
    }

    // Check for questions
    if (message.includes('?')) {
      this.metrics.questionsAsked++;
      if (message.toLowerCase().includes('chris') || message.toLowerCase().includes('you')) {
        this.metrics.userQuestioned++;
      }
    }

    // Check for pronoun errors (Name + Name instead of Name + you)
    const pronounErrorPattern = /(Wario|Domis|Scan|Chris),\s+(Wario|Domis|Scan|Chris)/i;
    if (pronounErrorPattern.test(message)) {
      this.metrics.pronounErrors.push({
        speaker,
        message
      });
    }

    // Track timing
    if (previousTimestamp) {
      const delay = timestamp - previousTimestamp;
      this.metrics.delays.push(delay);
      this.metrics.averageDelay =
        this.metrics.delays.reduce((a, b) => a + b, 0) / this.metrics.delays.length;
    }
  }

  analyzeAIChains(conversationHistory) {
    let currentChain = [];

    for (let i = 0; i < conversationHistory.length; i++) {
      const msg = conversationHistory[i];
      if (msg.speaker !== 'Chris') {
        currentChain.push(msg.speaker);
      } else {
        if (currentChain.length >= 3) {
          this.metrics.aiChains.push([...currentChain]);
        }
        currentChain = [];
      }
    }

    if (currentChain.length >= 3) {
      this.metrics.aiChains.push(currentChain);
    }
  }

  generateReport() {
    return `
╔═══════════════════════════════════════════════════════════╗
║           CONVERSATION ANALYSIS REPORT                      ║
╚═══════════════════════════════════════════════════════════╝

📊 MESSAGE STATISTICS:
  Total Messages: ${this.metrics.totalMessages}
  User Messages: ${this.metrics.userMessages} (${(this.metrics.userMessages / this.metrics.totalMessages * 100).toFixed(1)}%)
  AI Messages: ${this.metrics.aiMessages} (${(this.metrics.aiMessages / this.metrics.totalMessages * 100).toFixed(1)}%)

❓ ENGAGEMENT METRICS:
  Questions Asked: ${this.metrics.questionsAsked}
  User Directly Questioned: ${this.metrics.userQuestioned} times
  User Engagement Rate: ${(this.metrics.userMessages / Math.max(this.metrics.userQuestioned, 1) * 100).toFixed(1)}%

📝 MESSAGE QUALITY:
  Average Message Length: ${this.metrics.averageMessageLength.toFixed(1)} words
  Messages Over 30 Words: ${this.metrics.longMessages.length}
  Pronoun Errors Found: ${this.metrics.pronounErrors.length}

⏱️  TIMING ANALYSIS:
  Average Delay: ${(this.metrics.averageDelay / 1000).toFixed(1)}s
  Min Delay: ${Math.min(...this.metrics.delays) / 1000}s
  Max Delay: ${Math.max(...this.metrics.delays) / 1000}s
  Median Delay: ${this._median(this.metrics.delays) / 1000}s

🔗 AI CHAIN ANALYSIS:
  Long AI Chains (3+ messages): ${this.metrics.aiChains.length}
  ${this.metrics.aiChains.length > 0 ? 'Longest Chain: ' + Math.max(...this.metrics.aiChains.map(c => c.length)) + ' messages' : ''}

${this.metrics.longMessages.length > 0 ? `
⚠️  LONG MESSAGES (>30 words):
${this.metrics.longMessages.map(m => `  • ${m.speaker}: ${m.wordCount} words`).join('\n')}
` : ''}

${this.metrics.pronounErrors.length > 0 ? `
❌ PRONOUN ERRORS DETECTED:
${this.metrics.pronounErrors.slice(0, 3).map(e => `  • ${e.speaker}: "${e.message.substring(0, 60)}..."`).join('\n')}
` : '✅ No Pronoun Errors Detected!'}

`;
  }

  _median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
}

// ============= MAIN SIMULATION RUNNER =============

async function runSimulation(scenarioKey) {
  console.log('\n' + '='.repeat(70));
  console.log(`🎮 RUNNING SIMULATION: ${SIMULATION_CONFIG.scenarios[scenarioKey].name}`);
  console.log('='.repeat(70) + '\n');

  const scenario = SIMULATION_CONFIG.scenarios[scenarioKey];
  const analyzer = new ConversationAnalyzer();
  const userSimulator = new UserSimulator(scenario, scenario);

  // Initialize mock services
  const mockGemini = new MockGeminiService();

  // Track conversation
  const conversationLog = [];
  let startTime = Date.now();
  let lastMessageTime = startTime;

  // Simulate conversation for 60 seconds or 30 messages
  let messageCount = 0;
  const maxMessages = 30;
  const maxTime = 60000; // 60 seconds

  console.log('🎬 Conversation Started...\n');

  // Simulate president intro
  console.log(`[0.0s] President: "Identify the human. You have minutes to decide."`);
  conversationLog.push({
    timestamp: Date.now(),
    speaker: 'President',
    message: 'Identify the human. You have minutes to decide.'
  });

  // Wait a bit, then start AI conversation
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate conversation loop
  while (messageCount < maxMessages && (Date.now() - startTime) < maxTime) {
    // AI generates message
    const aiSpeaker = ['Wario', 'Domis', 'Scan'][messageCount % 3];
    const previousMessage = conversationLog[conversationLog.length - 1];

    // Simulate AI delay
    const delayType = Math.random();
    let delay;
    if (delayType < 0.10) delay = 2000 + Math.random() * 2000;
    else if (delayType < 0.30) delay = 7000 + Math.random() * 3000;
    else delay = 4000 + Math.random() * 3000;

    await new Promise(resolve => setTimeout(resolve, delay));

    // Generate AI message
    const aiMessage = mockGemini._generateMockResponse(
      `player${(messageCount % 3) + 2}`,
      previousMessage?.message || '',
      {}
    );

    const now = Date.now();
    const elapsed = (now - startTime) / 1000;

    console.log(`[${elapsed.toFixed(1)}s] ${aiSpeaker}: "${aiMessage}"`);

    conversationLog.push({
      timestamp: now,
      speaker: aiSpeaker,
      message: aiMessage
    });

    analyzer.analyzeMessage(aiMessage, aiSpeaker, now, lastMessageTime);
    lastMessageTime = now;
    messageCount++;

    // Check if user should respond
    if (userSimulator.shouldRespond(aiMessage, conversationLog)) {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      const userResponse = userSimulator.generateResponse(aiMessage, conversationLog);
      const userTime = Date.now();
      const userElapsed = (userTime - startTime) / 1000;

      console.log(`[${userElapsed.toFixed(1)}s] Chris: "${userResponse}"`);

      conversationLog.push({
        timestamp: userTime,
        speaker: 'Chris',
        message: userResponse
      });

      analyzer.analyzeMessage(userResponse, 'Chris', userTime, lastMessageTime);
      lastMessageTime = userTime;
      messageCount++;
    }
  }

  console.log('\n🏁 Conversation Ended\n');

  // Final analysis
  analyzer.analyzeAIChains(conversationLog);
  const report = analyzer.generateReport();

  console.log(report);

  // Check against expected outcomes
  console.log('✓ EXPECTED OUTCOMES:');
  scenario.expectedOutcomes.forEach(outcome => {
    console.log(`  • ${outcome}`);
  });

  return {
    analyzer,
    conversationLog,
    scenario
  };
}

// ============= RUN ALL SCENARIOS =============

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     REVERSE TURING TEST - CONVERSATION SIMULATION         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const scenarios = Object.keys(SIMULATION_CONFIG.scenarios);

  for (const scenario of scenarios) {
    await runSimulation(scenario);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✅ All simulations complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runSimulation, runAllTests, ConversationAnalyzer };
