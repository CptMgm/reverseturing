import ModeratorController from './src/services/moderatorController.js';

// Mock GeminiLiveService
const mockGeminiLive = {
    sendText: (text, playerId) => {
        console.log(`[MockGemini] Sending text to ${playerId}: ${text}`);
    },
    broadcastText: (text, playerIds) => {
        console.log(`[MockGemini] Broadcasting text to ${playerIds.join(', ')}: ${text}`);
    }
};

async function runTest() {
    console.log('🧪 Starting Game Logic Test');

    const moderator = new ModeratorController();

    // 1. Start Game
    console.log('\n--- Phase 1: Start Game ---');
    const intro = moderator.startGame();
    console.log('Intro Script:', intro.text.substring(0, 50) + '...');

    if (moderator.currentPhase !== 'PRESIDENT_INTRO') {
        console.error('❌ Failed to enter PRESIDENT_INTRO phase');
        return;
    }

    // 2. President Intro Complete
    console.log('\n--- Phase 2: Self Organization ---');
    moderator.onPresidentIntroComplete();

    if (moderator.currentPhase !== 'SELF_ORGANIZATION') {
        console.error('❌ Failed to enter SELF_ORGANIZATION phase');
        return;
    }

    // 3. Simulate AI Response (First AI becomes Secret Moderator)
    console.log('\n--- Phase 3: Secret Moderator Selection ---');
    moderator.onAIResponse('player3', 'I think we should all calm down.', []);

    if (moderator.secretModeratorId !== 'player3') {
        console.error('❌ Failed to set Secret Moderator');
        return;
    }

    if (moderator.currentPhase !== 'FREE_DEBATE') {
        console.error('❌ Failed to enter FREE_DEBATE phase');
        return;
    }
    console.log('✅ Secret Moderator set to player3');

    // 4. Simulate Voting
    console.log('\n--- Phase 4: Voting ---');

    // Player 2 votes for Player 4
    moderator.onAIResponse('player2', 'I vote for Scan because he is acting weird.', []);

    // Player 3 votes for Player 4
    moderator.onAIResponse('player3', 'My vote is Scan as well.', []);

    // Player 1 (Human) votes for Player 4 (via UI usually, but let's simulate logic)
    // The controller doesn't have a direct method for human vote from UI in this test, 
    // but we can simulate it by manually updating votes or adding a method.
    // Let's assume the UI calls a method or we just check the logic for 3 votes.
    // Wait, `registerVote` is public.
    moderator.registerVote('player1', 'player4');

    const consensus = moderator.checkConsensus();
    if (consensus && consensus.playerId === 'player4') {
        console.log('✅ Consensus reached for player4');
    } else {
        console.error('❌ Failed to reach consensus');
        console.log('Current votes:', moderator.votes);
        return;
    }

    // 5. Call President
    console.log('\n--- Phase 5: Verdict ---');
    const verdict = moderator.callPresidentBack();
    console.log('Verdict:', verdict.text);
    console.log('Outcome:', verdict.outcome);

    if (moderator.currentPhase !== 'PRESIDENT_VERDICT') {
        console.error('❌ Failed to enter PRESIDENT_VERDICT phase');
        return;
    }

    console.log('\n✅ ALL TESTS PASSED');
}

runTest();
