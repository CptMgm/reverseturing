import { Player, Position, Rotation, Seat } from '../components';

/**
 * PlayerSystem - Manages player entity logic
 * Updates player positions based on seat assignments
 */
export const PlayerSystem = (world) => {
  return {
    /**
     * Initialize player positions around the table
     */
    init: () => {
      world.query(Player, Position, Rotation, Seat).updateEach(([player, position, rotation, seat]) => {
        // Skip human player (they don't need position updates)
        if (player.type === 'human') return;

        // Calculate position based on seat angle and radius
        const angle = seat.angle;
        position.x = Math.sin(angle) * seat.radius + seat.tableCenterX;
        position.y = 1.0; // Seat height
        position.z = Math.cos(angle) * seat.radius + seat.tableCenterZ;

        // Face toward table center
        rotation.y = angle + Math.PI;
      });
    },

    /**
     * Update system - called every frame
     */
    update: (delta) => {
      // Future: Add animations, movement, etc.
    },

    /**
     * Get all players
     */
    getPlayers: () => {
      const playersList = [];
      world.query(Player).updateEach(([player]) => {
        playersList.push(player);
      });
      return playersList;
    },

    /**
     * Get player by ID
     */
    getPlayerById: (playerId) => {
      let found = null;
      world.query(Player).updateEach(([player], entity) => {
        if (player.id === playerId) {
          found = entity;
        }
      });
      return found;
    }
  };
};
