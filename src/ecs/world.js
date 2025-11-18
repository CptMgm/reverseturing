import { createWorld } from 'koota';

/**
 * Main ECS World instance for the Reverse Turing Test game
 * All game entities, components, and systems are registered here
 */
export const gameWorld = createWorld();

export default gameWorld;
