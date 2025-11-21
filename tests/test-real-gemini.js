/**
 * REAL GEMINI API CONVERSATION TEST
 * This test uses the actual Gemini API to validate conversation flow
 *
 * Run with: node tests/test-real-gemini.js
 * Requires: GEMINI_API_KEY environment variable
 */

import dotenv from 'dotenv';
import { GeminiLiveService } from '../src/services/geminiLiveService.js';
import { getPlayerPrompt } from '../src/utils/reverseGamePersonas.js';

dotenv.config();

// ============= TEST CONFIGURATION =============

const TEST_CONFIG = {
  scenario: 'CHATTY_USER', // Silent, Chatty, Normal, or Evasive
  duration: 90000, // 90 seconds
  maxMessages: 20,

  scenarios: {
    SILENT_USER: {
      name: 'Silent User (Never Responds)',
      responseRate: 0,
      expectedOutcomes: [
        'AIs should escalate after 45s',
        'Multiple aggressive callouts to user',
        'Eventually AIs focus on each other'
      ]
    },
    CHATTY_USER: {
      name: 'Chatty User (Responds Often)',
      responseRate: 0.8,
      expectedOutcomes: [
        'User gets many turns',
        'Natural back-and-forth',
        'AIs interrogate user frequently'
      ]
    },
    NORMAL_USER: {
      name: 'Normal User (Balanced)',
      responseRate: 0.4,
      expectedOutcomes: [
        'Balanced conversation',
        'Mix of AI-AI and AI-User',
        'Natural flow'
      ]
    },
    EVASIVE_USER: {
      name: 'Evasive User (Short Answers)',
      responseRate: 0.5,
      responseStyle: 'minimal',
      expectedOutcomes: [
        'AIs become suspicious',
        'More aggressive questioning',
        'Accusations of being a bot'
      ]
    }
  }
};

// ============= USER SIMULATOR =============

class UserSimulator {
  constructor(config) {
    this.config = config;
    this.responseCount = 0;
  }

  shouldRespond(message) {
    const mentioned = message.toLowerCase().includes('chris');
    const isQuestion = message.includes('?');

    if (this.config.scenario === 'SILENT_USER') return false;
    if (!mentioned) return false;

    if (this.config.scenario === 'CHATTY_USER') {
      return Math.random() < this.config.scenarios.CHATTY_USER.responseRate;
    }

    if (this.config.scenario === 'NORMAL_USER') {
      return isQuestion && Math.random() < this.config.scenarios.NORMAL_USER.responseRate;
    }

    if (this.config.scenario === 'EVASIVE_USER') {
      return isQuestion && Math.random() < this.config.scenarios.EVASIVE_USER.responseRate;
    }

    return false;
  }

  generateResponse(message) {
    this.responseCount++;

    if (this.config.scenario === 'EVASIVE_USER') {
      const responses = ['idk', 'maybe', 'sure', 'I guess', 'whatever'];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (message.toLowerCase().includes('memory') || message.toLowerCase().includes('remember')) {
      return 'I remember playing outside as a kid';
    }

    if (message.toLowerCase().includes('prove') || message.toLowerCase().includes('human')) {
      return "I'm human! I can think and feel!";
    }

    if (message.toLowerCase().includes('quiet') || message.toLowerCase().includes('silent')) {
      return "Just trying to figure this out";
    }

    const responses = [
      "I don't know what to say",
      "This is crazy",
      "How do I prove I'm human?",
      "I'm trying my best",
      "What do you want from me?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// ============= CONVERSATION TRACKER =============

class ConversationTracker {
  constructor() {
    this.messages = [];
    this.startTime = Date.now();
    this.lastUserMessageTime = Date.now();
  }

  addMessage(speaker, text, timestamp = Date.now()) {
    const elapsed = (timestamp - this.startTime) / 1000;
    this.messages.push({ speaker, text, timestamp, elapsed });

    if (speaker === 'Chris') {
      this.lastUserMessageTime = timestamp;
    }

    console.log(`[${elapsed.toFixed(1)}s] ${speaker}: "${text}"`);
  }

  getTimeSinceUserMessage() {
    return Date.now() - this.lastUserMessageTime;
  }

  getRecentMessages(count = 5) {
    return this.messages.slice(-count);
  }

  analyze() {
    const totalMessages = this.messages.length;
    const userMessages = this.messages.filter(m => m.speaker === 'Chris').length;
    const aiMessages = totalMessages - userMessages - 1; // -1 for President
    const questions = this.messages.filter(m => m.text.includes('?')).length;
    const userQuestioned = this.messages.filter(m =>
      m.text.includes('?') && m.text.toLowerCase().includes('chris')
    ).length;

    const wordCounts = this.messages.map(m => m.text.split(/\s+/).length);
    const avgLength = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const longMessages = this.messages.filter(m =>
      m.text.split(/\s+/).length > 30
    );

    // Check for pronoun errors
    const pronounErrors = [];
    this.messages.forEach(msg => {
      const pattern = /(Wario|Domis|Scan|Chris),\s+(Wario|Domis|Scan|Chris)/i;
      if (pattern.test(msg.text)) {
        pronounErrors.push({ speaker: msg.speaker, text: msg.text });
      }
    });

    return {
      totalMessages,
      userMessages,
      aiMessages,
      questions,
      userQuestioned,
      avgLength: avgLength.toFixed(1),
      longMessages: longMessages.length,
      pronounErrors: pronounErrors.length,
      duration: (this.messages[this.messages.length - 1].elapsed).toFixed(1)
    };
  }

  printAnalysis() {
    const stats = this.analyze();

    console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║           REAL GEMINI API TEST RESULTS                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📊 MESSAGE STATISTICS:');
    console.log(`  Total Messages: ${stats.totalMessages}`);
    console.log(`  User Messages: ${stats.userMessages} (${(stats.userMessages/stats.totalMessages*100).toFixed(1)}%)`);
    console.log(`  AI Messages: ${stats.aiMessages} (${(stats.aiMessages/stats.totalMessages*100).toFixed(1)}%)`);
    console.log('');

    console.log('❓ ENGAGEMENT METRICS:');
    console.log(`  Questions Asked: ${stats.questions}`);
    console.log(`  User Directly Questioned: ${stats.userQuestioned} times`);
    console.log(`  User Response Rate: ${stats.userMessages > 0 ? (stats.userMessages/stats.userQuestioned*100).toFixed(1) : 0}%`);
    console.log('');

    console.log('📝 MESSAGE QUALITY:');
    console.log(`  Average Message Length: ${stats.avgLength} words`);
    console.log(`  Messages Over 30 Words: ${stats.longMessages}`);
    console.log(`  Pronoun Errors Found: ${stats.pronounErrors}`);
    console.log('');

    console.log(`⏱️  DURATION: ${stats.duration} seconds`);
    console.log('');

    if (stats.pronounErrors === 0) {
      console.log('✅ No Pronoun Errors Detected!');
    } else {
      console.log(`❌ ${stats.pronounErrors} Pronoun Errors Found!`);
    }
  }
}

// ============= MAIN TEST RUNNER =============

async function runRealGeminiTest() {
  // Check for API key (supports both GEMINI_API_KEY and GOOGLE_API_KEY_*)
  const apiKey = process.env.GEMINI_API_KEY ||
                 process.env.GOOGLE_API_KEY_F3 ||
                 process.env.GOOGLE_API_KEY_SEL ||
                 process.env.GOOGLE_API_KEY_AP;

  if (!apiKey) {
    console.error('❌ ERROR: No Gemini API key found!');
    console.log('Please add GEMINI_API_KEY or GOOGLE_API_KEY to your .env file');
    process.exit(1);
  }

  console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...`);

  const scenario = TEST_CONFIG.scenarios[TEST_CONFIG.scenario];

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     REVERSE TURING TEST - REAL GEMINI API TEST           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`📋 Scenario: ${scenario.name}`);
  console.log(`⏱️  Duration: ${TEST_CONFIG.duration/1000} seconds`);
  console.log(`🔑 Using real Gemini API (gemini-2.0-flash)\n`);
  console.log('======================================================================\n');

  // Initialize services
  const gemini = new GeminiLiveService();
  const userSim = new UserSimulator(TEST_CONFIG);
  const tracker = new ConversationTracker();

  // Initialize AI players
  const players = [
    { id: 'player2', name: 'Wario' },
    { id: 'player3', name: 'Domis' },
    { id: 'player4', name: 'Scan' }
  ];

  console.log('🔄 Initializing AI players with Gemini API...\n');

  for (const player of players) {
    const prompt = getPlayerPrompt(player.id, false, 'Chris');
    await gemini.initializeSession(player.id, player.name, prompt, apiKey);
  }

  // Start conversation
  console.log('🎬 Conversation Started...\n');
  tracker.addMessage('President', 'Identify the human. You have minutes to decide.');

  const startTime = Date.now();
  let messageCount = 0;
  let currentPlayerIndex = 0;

  // Conversation loop
  while (messageCount < TEST_CONFIG.maxMessages && (Date.now() - startTime) < TEST_CONFIG.duration) {
    // Select AI to speak
    const player = players[currentPlayerIndex];
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Simulate delay
    const delayType = Math.random();
    let delay;
    if (delayType < 0.10) delay = 2000 + Math.random() * 2000; // Quick
    else if (delayType < 0.30) delay = 7000 + Math.random() * 3000; // Slow
    else delay = 4000 + Math.random() * 3000; // Normal

    await new Promise(resolve => setTimeout(resolve, delay));

    // Build context
    const recentMessages = tracker.getRecentMessages();
    const timeSinceUser = tracker.getTimeSinceUserMessage();
    const humanBeenQuiet = timeSinceUser > 45000;

    // Create prompt based on context
    let prompt;
    if (humanBeenQuiet) {
      prompt = `[CRITICAL ALERT]: Chris has been SILENT for ${Math.floor(timeSinceUser/1000)} seconds! Call them out AGGRESSIVELY.`;
    } else if (recentMessages.length > 0) {
      const lastMsg = recentMessages[recentMessages.length - 1];
      prompt = `[${lastMsg.speaker} just said]: "${lastMsg.text}"\n\nRespond naturally. Keep it under 30 words.`;
    } else {
      prompt = 'Start the conversation. Accuse someone of being a bot.';
    }

    // Get AI response directly from Gemini API (bypassing moderator callback)
    try {
      const session = gemini.sessions.get(player.id);
      if (!session) continue;

      // Add prompt to history
      session.history.push({ role: "user", parts: [{ text: prompt }] });

      // Call Gemini API directly
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: session.history,
          generationConfig: {
            response_modalities: ["TEXT"],
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;

        // Add to history
        session.history.push({ role: "model", parts: [{ text: aiResponse }] });

        tracker.addMessage(player.name, aiResponse);
        messageCount++;

        // Check if user should respond
        if (userSim.shouldRespond(aiResponse)) {
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

          const userResponse = userSim.generateResponse(aiResponse);
          tracker.addMessage('Chris', userResponse);
          messageCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error getting response from ${player.name}:`, error.message);
    }
  }

  console.log('\n🏁 Conversation Ended\n');

  // Print analysis
  tracker.printAnalysis();

  console.log('\n✓ EXPECTED OUTCOMES:');
  scenario.expectedOutcomes.forEach(outcome => {
    console.log(`  • ${outcome}`);
  });
  console.log('\n');
}

// Run the test
runRealGeminiTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
