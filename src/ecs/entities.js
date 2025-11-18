import gameWorld from './world';
import {
  Position,
  Rotation,
  Scale,
  Player,
  Speaking,
  Avatar,
  Seat,
  Nameplate,
  Object3D
} from './components';

/**
 * Create a player entity with all necessary traits
 */
export const createPlayerEntity = (playerData) => {
  const seatAngle = calculateSeatAngle(playerData.id, playerData.type);

  const entity = gameWorld.spawn(
    Player({
      id: playerData.id,
      name: playerData.name,
      type: playerData.type || 'ai',
      modelProvider: playerData.modelProvider || '',
      personality: playerData.personality || '',
      avatarUrl: playerData.avatarUrl || '',
      isEliminated: false,
      votes: 0,
    }),
    Position({
      x: 0,
      y: 1.0,
      z: 0,
    }),
    Rotation({
      x: 0,
      y: 0,
      z: 0,
    }),
    Scale({
      x: 1.0,
      y: 1.0,
      z: 1.0,
    }),
    Speaking({
      isSpeaking: false,
      message: '',
      timestamp: 0,
    }),
    Avatar({
      modelUrl: playerData.avatarUrl || '',
      scale: 1.0,
      color: '#ffffff',
      emissiveIntensity: 0,
    }),
    Seat({
      index: playerData.seatIndex || 0,
      angle: seatAngle,
      radius: 3.0,
      tableCenterX: 0,
      tableCenterY: 0,
      tableCenterZ: -3.5,
    }),
    Nameplate({
      text: playerData.name,
      fontSize: 0.25,
      color: '#ffffff',
    }),
    Object3D({
      ref: null,
    })
  );

  return entity;
};

/**
 * Calculate seat angle based on player ID
 */
const calculateSeatAngle = (playerId, playerType) => {
  if (playerType === 'human') return 0;

  const seatAngles = {
    'moderator': Math.PI,
    'player1': Math.PI * 2/3,
    'player2': Math.PI * 4/3,
    'player3': Math.PI * 1/3,
    'player4': Math.PI * 5/3,
  };

  return seatAngles[playerId] || 0;
};

/**
 * Initialize all player entities from player data array
 * Includes moderator and maps data from useGameLogic format to ECS format
 */
export const initializePlayerEntities = (playersData) => {
  const entities = [];

  // Add moderator first
  const moderatorEntity = createPlayerEntity({
    id: 'moderator',
    name: 'Dorkesh Cartel',
    type: 'moderator',
    modelProvider: 'google',
    personality: 'Formal AI moderator with dark humor',
    avatarUrl: '',
    seatIndex: -1 // Special index for moderator (not at table)
  });
  entities.push(moderatorEntity);

  // Add all players (human + AIs)
  playersData.forEach((playerData, index) => {
    const entity = createPlayerEntity({
      id: playerData.id,
      name: playerData.name,
      type: playerData.type,
      modelProvider: playerData.model || '',
      personality: '', // Could map from aiPersonas if needed
      avatarUrl: '',
      seatIndex: index
    });
    entities.push(entity);
  });

  return entities;
};

/**
 * Cleanup all entities
 */
export const cleanupEntities = () => {
  // Destroy all entities
  for (const entity of gameWorld.query()) {
    entity.destroy();
  }
};
