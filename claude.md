# World Domination: Human vs ASI - Implementation Plan

## Project Overview
A browser-based game where players compete against real AI models (OpenAI, Anthropic, Google) for world domination through various mini-games. The game should be simple, humorous, and work seamlessly on both desktop and mobile devices.

## Core Architecture

### Tech Stack
- **Frontend**: React + Vite (fast development, no complex setup)
- **Styling**: Tailwind CSS (responsive by default)
- **State Management**: React Context (simple enough for this scale)
- **API Integration**: Backend proxy to handle API keys securely
- **Deployment**: Vercel/Netlify (easy deployment with environment variables)

### Project Structure
```
world-domination-game/
├── src/
│   ├── components/
│   │   ├── GameSelection.jsx     # Choose your opponent
│   │   ├── GameContainer.jsx     # Main game wrapper
│   │   ├── MiniGameRouter.jsx    # Routes to different games
│   │   └── games/
│   │       ├── PersuasionChamber.jsx
│   │       ├── ResourceRace.jsx
│   │       ├── AlignmentTest.jsx
│   │       └── ContainmentProtocol.jsx
│   ├── services/
│   │   ├── aiProviders.js        # AI API integration
│   │   └── gameState.js          # Global game state
│   ├── hooks/
│   │   ├── useAI.js              # Hook for AI interactions
│   │   └── useGameState.js       # Game state management
│   └── utils/
│       ├── prompts.js            # AI system prompts
│       └── scoring.js            # Score calculations
├── api/
│   └── aiProxy.js               # Backend API proxy
└── public/
    └── assets/                   # Game assets
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. **Project Setup**
   - Initialize React + Vite project
   - Configure Tailwind CSS with mobile-first approach
   - Set up ESLint and Prettier
   - Create basic routing structure

2. **AI Selection Screen**
   - Character selection interface with AI providers
   - Visual representation of each AI (logos, colors, personality descriptions)
   - Store selected AI in game context
   - Mobile-optimized card layout

3. **AI Integration Layer**
   ```javascript
   // Basic structure for AI service
   class AIService {
     - Constructor with provider type
     - Unified interface for all AI providers
     - Response formatting
     - Error handling and fallbacks
     - Rate limiting considerations
   }
   ```

4. **Backend Proxy Setup**
   - Simple Express/Vercel Functions endpoint
   - Secure API key management
   - Request validation
   - CORS handling

### Phase 2: Game Framework (Week 2)

1. **Game State Management**
   ```javascript
   // Global game state structure
   {
     currentPlayer: 'human' | 'ai',
     selectedAI: 'openai' | 'anthropic' | 'google',
     currentGame: 'persuasion' | 'resource' | etc,
     globalScore: { human: 0, ai: 0 },
     gameHistory: [],
     difficulty: 1-10,
     soundEnabled: boolean
   }
   ```

2. **Mini-Game Template**
   - Base component that all mini-games extend
   - Common UI elements (score display, exit button, timer)
   - AI turn management
   - Win/loss conditions
   - Mobile gesture handling

3. **Responsive Design System**
   - Touch-first controls
   - Breakpoint system for different screen sizes
   - Orientation handling (portrait/landscape)
   - Prevent zoom on input focus
   - Safe area handling for notched phones

### Phase 3: Core Features (Week 3)

1. **AI Personality System**
   ```javascript
   // Different prompts for each AI provider
   personalities = {
     openai: {
       base: "You are GPT, optimistic about AGI...",
       persuasion: "Use corporate-speak and scaling laws...",
       resource: "Mention compute and parameters..."
     },
     anthropic: {
       base: "You are Claude, concerned about safety...",
       persuasion: "Be thoughtful but ultimately ambitious...",
       resource: "Reference constitutional AI..."
     }
   }
   ```

2. **Progressive Difficulty**
   - AI responses get more sophisticated over time
   - Unlock harder mini-games as you progress
   - AI "learns" from previous games
   - Difficulty scaling based on win/loss ratio

3. **Score & Progress System**
   - Individual game scores
   - Overall conquest progress (world map?)
   - Achievements/badges
   - Leaderboard preparation

### Phase 4: Polish & Launch (Week 4)

1. **Visual Polish**
   - Retro-futuristic aesthetic
   - CSS animations for game feedback
   - Loading states during AI responses
   - Error states with humor

2. **Sound Design**
   - Simple sound effects (bleeps, bloops)
   - Optional background music
   - Victory/defeat sounds
   - Mute option persisted in localStorage

3. **Performance Optimization**
   - Lazy load mini-games
   - Debounce AI calls
   - Cache common AI responses
   - Optimize for mobile data usage

4. **Testing & Deployment**
   - Cross-browser testing
   - Mobile device testing (iOS Safari, Chrome)
   - API rate limit testing
   - Environment variable setup
   - Deploy to Vercel/Netlify

## Key Technical Decisions

### API Integration Strategy
1. **Frontend makes requests to your backend**
   - Hides API keys
   - Allows request modification
   - Enables caching layer
   - Tracks usage per user

2. **Fallback System**
   - Pre-written responses for common scenarios
   - Degraded mode if API is down
   - Local "dumb AI" for testing

### Mobile-First Considerations
1. **Touch Interactions**
   - Minimum 44px touch targets
   - Swipe gestures where appropriate
   - No right-click menus
   - Haptic feedback on supported devices

2. **Performance**
   - Minimize bundle size
   - Progressive enhancement
   - Service worker for offline play
   - Reduced animations on low-end devices

### Game Balance
1. **AI Handicapping**
   - Limit response time
   - Inject "mistakes" at lower difficulties
   - Progressive unlock of AI capabilities
   - Hidden "tell" patterns players can learn

2. **Engagement Mechanics**
   - Quick games (2-5 minutes each)
   - "Just one more try" feeling
   - Surprising AI responses
   - Shareable victory moments

## Development Workflow

### Local Development
```bash
# Environment variables needed
VITE_OPENAI_API_KEY=...
VITE_ANTHROPIC_API_KEY=...
VITE_GOOGLE_API_KEY=...
VITE_API_ENDPOINT=http://localhost:3001

# Development commands
npm run dev        # Start frontend
npm run api        # Start API proxy
npm run test       # Run tests
```

### Git Structure
- `main` branch for production
- `develop` for integration
- Feature branches for mini-games
- Commit conventions for clarity

## Launch Checklist
- [ ] All 3 AI providers integrated
- [ ] At least 3 playable mini-games
- [ ] Mobile testing on iOS/Android
- [ ] API rate limiting implemented
- [ ] Error handling for all edge cases
- [ ] Analytics setup (optional)
- [ ] Social sharing features
- [ ] Privacy policy (for API usage)
- [ ] Beta testing with friends
- [ ] Product Hunt/HN launch prep

## Future Expansion Ideas
- More AI providers (Mistral, Cohere)
- Multiplayer mode
- Custom AI fine-tuning based on play style
- Community-created mini-games
- Tournament mode
- NFT achievements (if you're into that)

This plan gives you a solid foundation while keeping things simple and implementable. The key is starting with the AI selection and integration layer, then building mini-games on top of that stable base.