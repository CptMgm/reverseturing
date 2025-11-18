import { Player, Speaking, Avatar } from '../components';

/**
 * SpeakingSystem - Manages speaking indicators and effects
 */
export const SpeakingSystem = (world) => {
  return {
    /**
     * Set current speaker
     */
    setSpeaker: (playerId) => {
      // Clear all speaking states
      world.query(Speaking).updateEach(([speaking]) => {
        speaking.isSpeaking = false;
      });

      // Set new speaker
      if (playerId) {
        world.query(Player, Speaking, Avatar).updateEach(([player, speaking, avatar]) => {
          if (player.id === playerId) {
            speaking.isSpeaking = true;
            speaking.timestamp = Date.now();
            avatar.emissiveIntensity = 0.8;
          }
        });
      }
    },

    /**
     * Get current speaker
     */
    getCurrentSpeaker: () => {
      let currentSpeakerId = null;
      world.query(Player, Speaking).updateEach(([player, speaking]) => {
        if (speaking.isSpeaking) {
          currentSpeakerId = player.id;
        }
      });
      return currentSpeakerId;
    },

    /**
     * Update speaking animations/effects
     */
    update: (delta) => {
      const time = Date.now() / 1000;

      world.query(Speaking, Avatar).updateEach(([speaking, avatar]) => {
        if (speaking.isSpeaking) {
          // Pulse effect
          avatar.emissiveIntensity = 0.6 + Math.sin(time * 3) * 0.2;
        } else {
          avatar.emissiveIntensity = 0;
        }
      });
    }
  };
};
