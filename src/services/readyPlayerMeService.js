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

    console.log(`🎭 Getting curated avatar for ${playerId}...`);
    
    // Temporarily use the same working avatar URL for all characters to debug the issue
    const avatarUrl = 'https://models.readyplayer.me/689d222db09df363fd10ef30.glb';
    
    this.avatarCache.set(playerId, avatarUrl);
    console.log(`✅ Avatar URL set for ${playerId}: ${avatarUrl}`);
    
    return avatarUrl;
  }

  // Create avatar with specific configuration using Ready Player Me API
  async createAvatarWithConfig(config, playerId) {
    console.log(`🏗️ Creating avatar with config for ${playerId}:`, config);
    
    // Use Ready Player Me Studio API to create avatar
    const createUrl = `${this.baseUrl}/avatars`;
    
    const avatarPayload = {
      partner: 'default',
      bodyType: config.bodyType || 'average',
      assets: {
        hair: this.getHairAsset(config.hairColor),
        eyes: this.getEyeAsset(config.eyeColor),
        skin: this.getSkinAsset(config.skinColor),
        outfit: this.getOutfitAsset(config.outfit),
        ...(config.accessories?.includes('glasses') && { glasses: this.getGlassesAsset() })
      }
    };

    try {
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(avatarPayload),
      });

      if (!response.ok) {
        throw new Error(`Ready Player Me API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Avatar created for ${playerId}:`, result);
      
      return result.modelUrl || result.url;
    } catch (error) {
      console.error(`❌ Avatar creation failed for ${playerId}:`, error);
      throw error;
    }
  }

  // Helper methods to map character attributes to Ready Player Me assets
  getHairAsset(hairColor) {
    const hairAssets = {
      '#8B4513': 'hair_brown_01', // Brown
      '#2F4F4F': 'hair_dark_01',  // Dark gray
      '#2A2A2A': 'hair_black_01', // Black
      '#5A4A3A': 'hair_brown_02'  // Light brown
    };
    return hairAssets[hairColor] || 'hair_brown_01';
  }

  getEyeAsset(eyeColor) {
    const eyeAssets = {
      '#4682B4': 'eyes_blue_01',   // Blue
      '#8B4513': 'eyes_brown_01',  // Brown
      '#2F4F2F': 'eyes_green_01',  // Green
      '#708090': 'eyes_gray_01',   // Gray
      '#4A4A4A': 'eyes_dark_01'    // Dark
    };
    return eyeAssets[eyeColor] || 'eyes_brown_01';
  }

  getSkinAsset(skinColor) {
    const skinAssets = {
      '#F5DEB3': 'skin_light_01',   // Light
      '#FDBCB4': 'skin_medium_01',  // Medium
      '#D4A574': 'skin_olive_01',   // Olive
      '#FFE4C4': 'skin_fair_01',    // Fair
      '#D2B48C': 'skin_tan_01'      // Tan
    };
    return skinAssets[skinColor] || 'skin_medium_01';
  }

  getOutfitAsset(outfit) {
    const outfitAssets = {
      'business': 'outfit_business_suit',
      'formal': 'outfit_formal_suit',
      'casual': 'outfit_casual_01'
    };
    return outfitAssets[outfit] || 'outfit_business_suit';
  }

  getGlassesAsset() {
    return 'glasses_modern_01';
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