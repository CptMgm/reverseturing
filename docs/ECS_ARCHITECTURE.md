# Entity Component System (ECS) Architecture

## Overview

The Reverse Turing Test game now uses the **Entity Component System (ECS)** pattern, implemented with the [Koota](https://github.com/pmndrs/koota) library. This architectural pattern provides better separation of concerns, improved performance, and easier extensibility.

## Core Concepts

### 1. **Entities**
Entities are unique identifiers that group related components together. In our game:
- Each player (human, AI, or moderator) is an entity
- Entities have no logic or data themselves
- They're simply containers for components

### 2. **Components** (Data)
Components are pure data structures with no logic. Located in `src/ecs/components.js`:

#### Core Components
- **`Position`**: 3D world position (x, y, z)
- **`Rotation`**: 3D rotation in radians (x, y, z)
- **`Scale`**: 3D scale values (x, y, z)

#### Game-Specific Components
- **`Player`**: Player identity and state
  ```js
  {
    id: string,
    name: string,
    type: 'human' | 'ai' | 'moderator',
    modelProvider: string,
    personality: string,
    avatarUrl: string,
    isEliminated: boolean,
    votes: number
  }
  ```

- **`Speaking`**: Current speaker state
  ```js
  {
    isSpeaking: boolean,
    message: string,
    timestamp: number
  }
  ```

- **`Avatar`**: Visual representation data
  ```js
  {
    modelUrl: string,
    scale: number,
    color: string,
    emissiveIntensity: number
  }
  ```

- **`Seat`**: Table seating arrangement
  ```js
  {
    index: number,
    angle: number,
    radius: number,
    tableCenter: { x, y, z }
  }
  ```

- **`Nameplate`**: Display nameplate
  ```js
  {
    text: string,
    fontSize: number,
    color: string
  }
  ```

### 3. **Systems** (Logic)
Systems contain the game logic and operate on entities with specific component combinations. Located in `src/ecs/systems/`:

#### PlayerSystem
- **Purpose**: Manages player entity positions and state
- **Components Used**: `Player`, `Position`, `Rotation`, `Seat`
- **Key Functions**:
  - `init()`: Initialize player positions around the table
  - `update(delta)`: Per-frame updates
  - `getPlayers()`: Retrieve all player data
  - `getPlayerById(id)`: Find specific player

#### SpeakingSystem
- **Purpose**: Manages who is currently speaking and visual effects
- **Components Used**: `Player`, `Speaking`, `Avatar`
- **Key Functions**:
  - `setSpeaker(playerId)`: Set current speaker, clear others
  - `getCurrentSpeaker()`: Get ID of current speaker
  - `update(delta)`: Animate speaking effects (pulsing, glowing)

## File Structure

```
src/ecs/
├── world.js                    # Main ECS world instance
├── components.js               # All component definitions
├── entities.js                 # Entity creation helpers
└── systems/
    ├── index.js                # System exports
    ├── PlayerSystem.js         # Player management logic
    └── SpeakingSystem.js       # Speaking state logic
```

## How It Works

### 1. World Initialization
```javascript
import gameWorld from './ecs/world';
```
The `gameWorld` is a singleton instance of Koota's `World` class that manages all entities and components.

### 2. Entity Creation
```javascript
import { initializePlayerEntities } from './ecs/entities';

const playerData = [
  { id: 'player1', name: 'Alice', type: 'ai', ... },
  { id: 'human', name: 'Bob', type: 'human', ... },
  // ...
];

const entities = initializePlayerEntities(playerData);
```

### 3. System Updates
Systems run every frame via React Three Fiber's `useFrame`:

```javascript
const playerSystem = PlayerSystem(gameWorld);
const speakingSystem = SpeakingSystem(gameWorld);

useFrame((state, delta) => {
  playerSystem.update(delta);
  speakingSystem.update(delta);
});
```

### 4. Querying Entities
Systems use queries to find entities with specific components:

```javascript
import { query } from 'koota';

const players = query(Player, Position, Speaking);

for (const entity of players(world)) {
  const player = entity(Player);
  const position = entity(Position);
  const speaking = entity(Speaking);

  // Do something with the data
}
```

## Integration with React Three Fiber

The ECS architecture integrates seamlessly with R3F:

1. **Component State → ECS Components**: Game state lives in ECS components
2. **React Components → Render**: React components read ECS data to render 3D objects
3. **useFrame → Systems**: Systems update ECS state every frame
4. **Events → System Methods**: User actions call system methods to modify state

Example:
```javascript
const PlayerAvatar = ({ entity }) => {
  const player = entity(Player);
  const position = entity(Position);
  const speaking = entity(Speaking);

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh>
        <sphereGeometry />
        <meshStandardMaterial
          emissive={speaking.isSpeaking ? '#4a9eff' : '#000000'}
        />
      </mesh>
    </group>
  );
};
```

## Benefits of ECS

### 1. **Separation of Concerns**
- Data (Components) is separate from logic (Systems)
- Easy to understand what data each entity has
- Clear responsibility for each system

### 2. **Performance**
- Cache-friendly data layout
- Systems only process entities with relevant components
- No unnecessary object hierarchy traversal

### 3. **Flexibility**
- Easy to add new components without modifying existing code
- Mix and match components to create new entity types
- Systems are independent and reusable

### 4. **Debugging**
- Clear data flow: Components → Systems → Components
- Easy to inspect entity state
- Systems can be tested independently

## Best Practices

### ✅ DO
- Keep components as pure data structures
- Put all logic in systems
- Use queries to find relevant entities
- Update component data in systems
- Clean up entities when no longer needed

### ❌ DON'T
- Add methods to components
- Modify components directly in React components
- Create circular dependencies between systems
- Store refs or non-serializable data in components (use a separate Object3D component for refs)

## Example: Adding a New Feature

Let's say you want to add a "health bar" to players:

### Step 1: Create Component
```javascript
// src/ecs/components.js
export const Health = component(() => ({
  current: 100,
  max: 100,
  regenerationRate: 5
}));
```

### Step 2: Add to Entity Creation
```javascript
// src/ecs/entities.js
const entity = gameWorld.create(
  Player,
  Position,
  Health, // Add new component
  // ... other components
);

const health = entity(Health);
health.current = 100;
health.max = 100;
```

### Step 3: Create System
```javascript
// src/ecs/systems/HealthSystem.js
export const HealthSystem = (world) => {
  const healthyEntities = query(Health);

  return {
    update: (delta) => {
      for (const entity of healthyEntities(world)) {
        const health = entity(Health);

        // Regenerate health over time
        if (health.current < health.max) {
          health.current = Math.min(
            health.max,
            health.current + health.regenerationRate * delta
          );
        }
      }
    }
  };
};
```

### Step 4: Integrate System
```javascript
// src/components/GameSceneECS.jsx
const healthSystem = HealthSystem(gameWorld);

useFrame((state, delta) => {
  healthSystem.update(delta);
});
```

### Step 5: Render in React
```javascript
const HealthBar = ({ entity }) => {
  const health = entity(Health);
  const percentage = (health.current / health.max) * 100;

  return (
    <Html>
      <div style={{ width: '100px', height: '10px', background: '#333' }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: '#0f0'
        }} />
      </div>
    </Html>
  );
};
```

## References

- [Koota Documentation](https://github.com/pmndrs/koota)
- [ECS Pattern](https://en.wikipedia.org/wiki/Entity_component_system)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [viber3d](https://github.com/kevinkern/viber3d)
