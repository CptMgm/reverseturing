import { trait } from 'koota';

/**
 * Position Trait - 3D world position
 */
export const Position = trait({
  x: 0,
  y: 0,
  z: 0,
});

/**
 * Rotation Trait - 3D rotation in radians
 */
export const Rotation = trait({
  x: 0,
  y: 0,
  z: 0,
});

/**
 * Scale Trait - 3D scale
 */
export const Scale = trait({
  x: 1,
  y: 1,
  z: 1,
});

/**
 * Player Trait - Identifies a player entity
 */
export const Player = trait({
  id: '',
  name: '',
  type: 'ai', // 'human' | 'ai' | 'moderator'
  modelProvider: '', // e.g., 'anthropic', 'openai', etc.
  personality: '',
  avatarUrl: '',
  isEliminated: false,
  votes: 0,
});

/**
 * Speaking Trait - Indicates current speaker
 */
export const Speaking = trait({
  isSpeaking: false,
  message: '',
  timestamp: 0,
});

/**
 * Avatar Trait - Visual representation data
 */
export const Avatar = trait({
  modelUrl: '',
  scale: 1.0,
  color: '#ffffff',
  emissiveIntensity: 0,
});

/**
 * Seat Trait - Table seating arrangement
 */
export const Seat = trait({
  index: 0,
  angle: 0,
  radius: 3.0,
  tableCenterX: 0,
  tableCenterY: 0,
  tableCenterZ: -3.5,
});

/**
 * Nameplate Trait - Visual nameplate data
 */
export const Nameplate = trait({
  text: '',
  fontSize: 0.15,
  color: '#ffffff',
});

/**
 * Light Trait - Dynamic lighting
 */
export const Light = trait({
  type: 'point', // 'point' | 'spot' | 'directional'
  color: '#ffffff',
  intensity: 1.0,
  distance: 10,
  decay: 2,
});

/**
 * Object3D Trait - Reference to Three.js object
 */
export const Object3D = trait({
  ref: null,
});

/**
 * Conversation Trait - Tracks conversation state
 * Uses callback syntax for complex data (array)
 */
export const Conversation = trait(() => ({
  messages: [],
  currentRound: 1,
  maxRounds: 3,
  phase: 'discussion', // 'discussion' | 'voting' | 'result'
}));
