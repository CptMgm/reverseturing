class ReadyPlayerMeService {
  constructor() {
    this.apiKey = import.meta.env.VITE_READYPLAYERME_API_KEY || 'sk_live_MzETKWSgQ-N4nxzxiH7Seq2PzQN2qccUR3nF';
    this.baseUrl = 'https://api.readyplayer.me/v1';
    this.avatarCache = new Map();
  }

  // Character-specific avatar configurations
  getCharacterConfig(playerId) {
    const configs = {
      'player1': { // Elongated Muskett (Elon-inspired)
        gender: 'male',
        hairColor: '#8B4513',
        eyeColor: '#4682B4', 
        skinColor: '#F5DEB3',
        bodyType: 'skinny',
        outfit: 'business',
        accessories: ['glasses']
      },
      'player2': { // Wario Amadeuss (Dario-inspired)
        gender: 'male',
        hairColor: '#2F4F4F',
        eyeColor: '#8B4513',
        skinColor: '#FDBCB4',
        bodyType: 'average',
        outfit: 'business',
        accessories: ['glasses']
      },
      'player3': { // Domis Hassoiboi (Demis-inspired)
        gender: 'male',
        hairColor: '#2A2A2A',
        eyeColor: '#2F4F2F',
        skinColor: '#D4A574',
        bodyType: 'average',
        outfit: 'business',
        accessories: []
      },
      'player4': { // Scan Ctrl+Altman (Sam-inspired)
        gender: 'male',
        hairColor: '#5A4A3A',
        eyeColor: '#708090',
        skinColor: '#FFE4C4',
        bodyType: 'average',
        outfit: 'business',
        accessories: []
      },
      'moderator': { // Dorkesh Cartel (Dwarkesh-inspired)
        gender: 'male',
        hairColor: '#2A2A2A',
        eyeColor: '#4A4A4A',
        skinColor: '#D2B48C',
        bodyType: 'average',
        outfit: 'formal',
        accessories: ['glasses']
      }
    };

    return configs[playerId] || configs['player1'];
  }

  // Generate avatar URL for a character
  async generateAvatarUrl(playerId) {
    // Check cache first
    if (this.avatarCache.has(playerId)) {
      console.log(`🎯 Using cached avatar for ${playerId}`);
      return this.avatarCache.get(playerId);
    }

    console.log(`🎭 Getting avatar URL for ${playerId}...`);
    
    // For now, use the same avatar for all characters
    // TODO: Generate unique avatars with API
    const avatarUrl = 'https://models.readyplayer.me/689d222db09df363fd10ef30.glb';
    
    this.avatarCache.set(playerId, avatarUrl);
    console.log(`✅ Avatar URL set for ${playerId}: ${avatarUrl}`);
    
    return avatarUrl;
  }

  // Preload all character avatars
  async preloadAllAvatars() {
    const playerIds = ['player1', 'player2', 'player3', 'player4', 'moderator'];
    console.log('🚀 Preloading all Ready Player Me avatars...');
    
    const promises = playerIds.map(id => this.generateAvatarUrl(id));
    try {
      await Promise.all(promises);
      console.log('✅ All avatars preloaded successfully');
    } catch (error) {
      console.warn('⚠️ Some avatars failed to preload:', error);
    }
  }
}

// Export singleton instance
export const readyPlayerMeService = new ReadyPlayerMeService();
export default readyPlayerMeService;