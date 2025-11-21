import { TileType } from './types.js';
// Game version - increment this to force automatic reset on next load
export const GAME_VERSION = '1.0.7'; // Update this when you want to force a reset
export const TILE_SIZE = 32;
export const WORLD_WIDTH = 50;
export const WORLD_HEIGHT = 50;
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 576;
// Physics constants - Edit these to tweak movement
export const GRAVITY = 0.8; // How fast player falls (increased for faster falling)
export const JUMP_STRENGTH = -12; // JUMP_FORCE = 12 (negative for upward) - increased for better jump height
export const MOVE_SPEED = 4; // Horizontal movement speed (base speed, can be boosted by items) - increased
export const MAX_FALL_SPEED = 20; // Maximum falling speed (increased for faster falling)
export const PLAYER_WIDTH = 20; // Slim player that can fit through 1-block gaps
export const PLAYER_HEIGHT = 30; // Tall and slim like Growtopia characters
export const TILE_HEALTH = {
    [TileType.AIR]: 0,
    [TileType.DIRT]: 2,
    [TileType.GRASS]: 2,
    [TileType.STONE]: 5,
    [TileType.TREE]: 3,
    [TileType.WATER]: 1,
    [TileType.GOLD_LOCK]: 10,
    [TileType.BEDROCK]: 999999, // Unbreakable
    [TileType.SPAWN_DOOR]: 999999, // Unbreakable spawn marker
    [TileType.SIGN]: 5, // Breakable sign
    [TileType.SUPER_STARS]: 0, // Equippable shoes, not placeable
    [TileType.FEDORA]: 0, // Equippable hat, not placeable
    [TileType.SUIT_PANTS]: 0, // Equippable pants, not placeable
    [TileType.SUIT_SHIRT]: 0, // Equippable shirt, not placeable
    [TileType.RAINBOW_WINGS]: 0, // Equippable wings, not placeable
    [TileType.GEM]: 0, // Gem currency item, not placeable
    [TileType.PUNCH]: 0, // Punch is not a tile, just an item
    [TileType.WRENCH]: 0 // Wrench is not a tile, just an item
};
export const TILE_COLORS = {
    [TileType.AIR]: 'transparent',
    [TileType.DIRT]: '#8B4513',
    [TileType.GRASS]: '#228B22',
    [TileType.STONE]: '#696969',
    [TileType.TREE]: '#654321',
    [TileType.WATER]: '#4169E1',
    [TileType.GOLD_LOCK]: '#FFD700',
    [TileType.BEDROCK]: '#1a1a1a', // Dark gray/black for bedrock
    [TileType.SPAWN_DOOR]: '#8B4513', // Brown for spawn door
    [TileType.SIGN]: '#D2691E', // Light brown for sign background
    [TileType.SUPER_STARS]: '#FF0000', // Red shoes
    [TileType.FEDORA]: '#2C2C2C', // Dark gray fedora
    [TileType.SUIT_PANTS]: '#1a1a1a', // Black suit pants
    [TileType.SUIT_SHIRT]: '#FFFFFF', // White suit shirt
    [TileType.RAINBOW_WINGS]: '#FF1493', // Pink/magenta for rainbow wings
    [TileType.GEM]: '#00CED1', // Cyan for gems
    [TileType.PUNCH]: '#FF6347', // Red color for punch
    [TileType.WRENCH]: '#C0C0C0' // Silver for wrench
};
export const DAY_CYCLE_DURATION = 300000; // 5 minutes in milliseconds
export const INVENTORY_SLOTS = 8;
//# sourceMappingURL=constants.js.map