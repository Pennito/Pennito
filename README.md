# IPenno

A 2D sandbox game inspired by Growtopia and Terraria, built with TypeScript and HTML5 Canvas.

## Features

### Core Systems
- **World System**: 2D grid-based tile map (100×50 tiles) with procedural terrain generation
- **Player System**: Movement with WASD/Arrow keys, jumping, gravity, and collision detection
- **Block Interaction**: Break blocks (left-click) and place blocks (right-click) with health system
- **Inventory System**: 8-slot inventory with item counts and tooltips
- **Camera System**: Smooth camera following the player
- **Day/Night Cycle**: Dynamic sky colors and lighting that cycles every 5 minutes
- **Save/Load System**: Persistent world and player data using localStorage
- **UI System**: Start menu, pause menu, inventory HUD, and tooltips

### Tile Types
- Air
- Dirt
- Grass
- Stone
- Tree
- Water

## Getting Started

### Prerequisites
- Node.js and npm installed
- A modern web browser with ES6 module support

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript files:
```bash
npm run build
```

3. Serve the game using a local server (required for ES modules):
```bash
npm run serve
```

Or use any other local server:
```bash
# Python 3
python3 -m http.server 8000

# Node.js (if you have http-server installed)
npx http-server
```

4. Open your browser and navigate to `http://localhost:8000`

## Controls

### Movement
- **WASD** or **Arrow Keys**: Move player
- **W** or **Space**: Jump
- **ESC**: Pause menu

### Inventory
- **1-8**: Select inventory slot
- **Hover**: Show item tooltip

### Block Interaction
- **Left Click**: Break block (hold to break)
- **Right Click**: Place block from selected inventory slot

## Project Structure

```
sandbox-game/
├── src/
│   ├── main.ts          # Entry point
│   ├── game.ts          # Main game loop and state management
│   ├── world.ts         # World generation and tile management
│   ├── player.ts        # Player physics and movement
│   ├── input.ts         # Input handling (keyboard/mouse)
│   ├── camera.ts        # Camera system
│   ├── ui.ts            # UI rendering (menus, inventory, HUD)
│   ├── save.ts          # Save/load system
│   ├── utils/
│   │   ├── types.ts     # TypeScript types and interfaces
│   │   ├── constants.ts # Game constants
│   │   └── utils.ts     # Utility functions
│   └── assets/          # Asset directories (for future use)
├── dist/                # Compiled JavaScript (generated)
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Development

### Watch Mode
To automatically recompile on file changes:
```bash
npm run dev
```

### Building
To compile TypeScript to JavaScript:
```bash
npm run build
```

## Future Extensions

The codebase is designed to be easily extensible for:

1. **Multiplayer**: 
   - Add WebSocket client/server
   - Sync world state between players
   - Add player entities and chat system

2. **Crafting System**:
   - Add crafting recipes
   - Create crafting UI
   - Implement item combinations

3. **Farming**:
   - Add seed items
   - Implement crop growth mechanics
   - Add harvest system

4. **Enhanced Graphics**:
   - Add sprite sheets for tiles and player
   - Implement animations
   - Add particle effects

5. **Server-Based World**:
   - Move world storage to server
   - Implement authentication
   - Add persistent player accounts

## Technical Details

- **Game Loop**: Uses `requestAnimationFrame` with delta time for consistent movement
- **Physics**: Simple gravity and collision detection
- **Rendering**: Canvas 2D API with optimized tile rendering (only visible tiles)
- **Storage**: localStorage for save data (limited to ~5-10MB in most browsers)

## License

This project is open source and available for modification and extension.


