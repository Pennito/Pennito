# Game Architecture & Extension Guide

## Overview

This document describes the architecture of the 2D Sandbox Game and provides guidance on how to extend it for multiplayer, crafting, and other features.

## System Architecture

### Core Systems

#### 1. World System (`world.ts`)
- **Purpose**: Manages the 2D tile-based world
- **Key Features**:
  - Procedural terrain generation
  - Tile health system
  - Collision detection helpers
  - World serialization for save/load

**Key Methods**:
- `generate()`: Creates procedural terrain
- `getTile(x, y)`: Retrieves tile at position
- `setTile(x, y, type)`: Places a tile
- `damageTile(x, y, damage)`: Damages a tile (returns true when broken)
- `isSolid(x, y)`: Checks if tile is solid (for collision)
- `getWorldData()`: Serializes world for saving
- `loadWorldData(data)`: Deserializes world from save

**Extension Points**:
- Add new tile types in `TileType` enum
- Modify `generate()` for different terrain algorithms
- Add tile-specific behaviors (e.g., water flow, tree growth)

#### 2. Player System (`player.ts`)
- **Purpose**: Handles player physics, movement, and inventory
- **Key Features**:
  - Gravity and jumping
  - Collision detection
  - Inventory management
  - Player state serialization

**Key Methods**:
- `update(world, moveLeft, moveRight, jump)`: Updates player physics
- `checkCollision(world, x, y)`: Collision detection
- `addToInventory(type, count)`: Adds items to inventory
- `useFromInventory(type)`: Uses item from selected slot
- `getSelectedItem()`: Gets currently selected item
- `getPlayerData()` / `loadPlayerData()`: Serialization

**Extension Points**:
- Add player animations (idle, walk, jump)
- Add player stats (health, hunger, etc.)
- Add equipment system
- Add player abilities/skills

#### 3. Input Manager (`input.ts`)
- **Purpose**: Handles all keyboard and mouse input
- **Key Features**:
  - Key state tracking
  - Mouse position and button tracking
  - World-to-screen coordinate conversion

**Key Methods**:
- `isKeyPressed(key)`: Checks if key is currently pressed
- `isMouseButtonPressed(button)`: Checks mouse button (0=left, 2=right)
- `getMouseTile(tileSize)`: Converts mouse position to tile coordinates
- `updateMouseWorld(cameraX, cameraY)`: Updates world coordinates

**Extension Points**:
- Add input rebinding
- Add gamepad support
- Add touch controls for mobile

#### 4. Camera System (`camera.ts`)
- **Purpose**: Manages viewport and camera following
- **Key Features**:
  - Smooth camera following
  - Viewport management

**Key Methods**:
- `follow(targetX, targetY, targetWidth, targetHeight)`: Smoothly follows target
- `setPosition(x, y)`: Instantly sets camera position

**Extension Points**:
- Add camera shake effects
- Add zoom functionality
- Add camera bounds (limit to world edges)

#### 5. UI System (`ui.ts`)
- **Purpose**: Renders all UI elements
- **Key Features**:
  - Inventory bar with tooltips
  - Menu rendering
  - Day/night overlay
  - HUD elements

**Key Methods**:
- `renderInventory(inventory, selectedSlot)`: Renders inventory bar
- `renderMenu(title, options, selectedIndex)`: Renders menu
- `renderSky(dayTime)`: Renders sky background
- `renderDayNightOverlay(dayTime)`: Renders night darkness
- `renderHUD(dayTime)`: Renders HUD elements

**Extension Points**:
- Add health bar
- Add minimap
- Add chat UI
- Add crafting UI
- Add settings menu

#### 6. Game Loop (`game.ts`)
- **Purpose**: Orchestrates all systems and manages game state
- **Key Features**:
  - Game state management (MENU, PLAYING, PAUSED)
  - Block interaction logic
  - Day/night cycle
  - Save/load integration

**Key Methods**:
- `startNewGame()`: Initializes new game
- `loadGame()`: Loads saved game
- `saveGame()`: Saves current game state
- `update(deltaTime)`: Updates game logic
- `render()`: Renders game frame
- `gameLoop(currentTime)`: Main game loop

**Extension Points**:
- Add more game states (inventory menu, crafting menu, etc.)
- Add entity system for NPCs/mobs
- Add event system for game events

#### 7. Save System (`save.ts`)
- **Purpose**: Handles game state persistence
- **Key Features**:
  - localStorage-based saving
  - Save/load game state

**Key Methods**:
- `save(gameState)`: Saves game to localStorage
- `load()`: Loads game from localStorage
- `hasSave()`: Checks if save exists

**Extension Points**:
- Add multiple save slots
- Add cloud save integration
- Add save compression
- Add server-based saving

## Extending to Multiplayer

### Step 1: Add Network Client

Create a new file `src/network.ts`:

```typescript
export class NetworkClient {
  private ws: WebSocket | null = null;
  private connected: boolean = false;

  connect(url: string): void {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.connected = true;
      console.log('Connected to server');
    };
    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
  }

  send(data: any): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(data: any): void {
    // Handle server messages
  }
}
```

### Step 2: Add Player Entity System

Modify `player.ts` to support multiple players:

```typescript
export class PlayerEntity {
  public id: string;
  public x: number;
  public y: number;
  // ... other properties
}
```

### Step 3: Sync World Changes

In `game.ts`, send world changes to server:

```typescript
// When breaking/placing blocks
if (broken) {
  network.send({
    type: 'tile_break',
    x: mouseTile.x,
    y: mouseTile.y
  });
}
```

### Step 4: Receive World Updates

Handle incoming world updates:

```typescript
private handleMessage(data: any): void {
  switch (data.type) {
    case 'tile_update':
      this.world.setTile(data.x, data.y, data.tileType);
      break;
    case 'player_update':
      // Update other players
      break;
  }
}
```

### Step 5: Add Server (Node.js Example)

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const world = {}; // Shared world state

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
});
```

## Extending to Crafting

### Step 1: Add Crafting Recipes

Create `src/crafting.ts`:

```typescript
export interface Recipe {
  inputs: { type: TileType; count: number }[];
  output: { type: TileType; count: number };
}

export const RECIPES: Recipe[] = [
  {
    inputs: [{ type: TileType.DIRT, count: 2 }],
    output: { type: TileType.GRASS, count: 1 }
  }
];
```

### Step 2: Add Crafting UI

Extend `ui.ts`:

```typescript
public renderCraftingMenu(recipes: Recipe[], inventory: Item[]): void {
  // Render crafting interface
}
```

### Step 3: Add Crafting Logic

In `game.ts`:

```typescript
public craft(recipe: Recipe): boolean {
  // Check if player has required items
  // Remove items from inventory
  // Add output to inventory
}
```

## Adding New Tile Types

1. Add to `TileType` enum in `utils/types.ts`
2. Add color to `TILE_COLORS` in `utils/constants.ts`
3. Add health to `TILE_HEALTH` in `utils/constants.ts`
4. Add generation logic in `world.ts` `generate()` method
5. Add special behaviors if needed (e.g., water flow)

## Adding Animations

1. Create sprite sheet loader
2. Add animation state machine to `player.ts`
3. Update `player.render()` to use sprite frames
4. Add animation timing based on movement state

## Performance Optimization

### Current Optimizations
- Only renders visible tiles
- Uses delta time for consistent movement
- Efficient collision detection (point-based)

### Future Optimizations
- Spatial partitioning for collision detection
- Tile chunking for large worlds
- Object pooling for particles
- WebGL rendering for better performance

## Code Organization Principles

1. **Separation of Concerns**: Each file has a single responsibility
2. **Data-Driven Design**: Constants and types are centralized
3. **Serialization**: All game state can be saved/loaded
4. **Extensibility**: Systems are designed to be extended, not modified
5. **Modularity**: Systems communicate through well-defined interfaces

## Testing Strategy

### Unit Tests
- Test individual systems in isolation
- Test collision detection
- Test inventory management
- Test world generation

### Integration Tests
- Test save/load cycle
- Test block interaction
- Test player movement

### Manual Testing Checklist
- [ ] Player spawns correctly
- [ ] Movement and jumping work
- [ ] Blocks can be broken and placed
- [ ] Inventory updates correctly
- [ ] Save/load works
- [ ] Day/night cycle progresses
- [ ] Camera follows player smoothly

## Next Steps

1. **Multiplayer**: Implement WebSocket server and client
2. **Crafting**: Add recipe system and crafting UI
3. **Farming**: Add seeds, crops, and growth mechanics
4. **Graphics**: Add sprite sheets and animations
5. **Audio**: Add sound effects and background music
6. **Particles**: Add visual effects for block breaking
7. **Mobs**: Add NPCs and enemies
8. **Biomes**: Add different terrain types


