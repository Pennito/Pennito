export enum TileType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  TREE = 4,
  WATER = 5,
  GOLD_LOCK = 6,
  BEDROCK = 7, // Unbreakable world border block
  SPAWN_DOOR = 8, // Spawn door marker (unbreakable)
  SIGN = 9, // Sign block with editable text (background block)
  SUPER_STARS = 10, // Red shoes that increase speed by 1.5x
  FEDORA = 11, // Stylish fedora hat (equipable)
  SUIT_PANTS = 12, // Suit pants (equipable)
  SUIT_SHIRT = 13, // Suit shirt (equipable)
  RAINBOW_WINGS = 14, // Rainbow wings (equipable, enables double jump)
  GEM = 15, // Gem currency item (dropped when breaking blocks)
  FLAME_SWORD = 16, // Flame sword - 2x faster breaking, 1.5x more gems
  PUNCH = 99, // Special item for breaking blocks
  WRENCH = 98 // Special item for editing signs
}

export interface Tile {
  type: TileType;
  health: number;
  maxHealth: number;
  signText?: string; // For SIGN tiles - up to 20 characters
}

export interface Item {
  id: string;
  name: string;
  tileType: TileType;
  count: number;
  equipped?: boolean; // For equippable items like shoes
}

export interface PlayerData {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  inventory: Item[];
  selectedSlot: number;
  redeemedCodes?: string[]; // Track which codes have been redeemed
  equippedShoes?: TileType | null; // Currently equipped shoes (affects speed)
  equippedHat?: TileType | null; // Currently equipped hat
  equippedShirt?: TileType | null; // Currently equipped shirt
  equippedPants?: TileType | null; // Currently equipped pants
  equippedWings?: TileType | null; // Currently equipped wings (enables double jump)
  equippedSword?: TileType | null; // Currently equipped sword (affects breaking speed and gem drops)
  maxInventorySlots?: number; // Expandable inventory slots
  gems?: number; // Player's gem currency
  username?: string; // Player username (for multiplayer)
}

export interface SignData {
  x: number;
  y: number;
  text: string;
}

export interface DroppedItemData {
  x: number;
  y: number;
  tileType: TileType;
  gemValue?: number;
  spawnTime: number;
}

export interface WorldData {
  tiles: Tile[][];
  width: number;
  height: number;
  seed: number;
  owner?: string; // Optional world owner username
  spawnX?: number; // Spawn door X position (in tiles)
  spawnY?: number; // Spawn door Y position (in tiles)
  signs?: SignData[]; // Sign text data
  droppedItems?: DroppedItemData[]; // Dropped items in the world
}

export interface GameState {
  world: WorldData;
  player: PlayerData;
  dayTime: number; // 0-1, where 0 is midnight, 0.5 is noon
  isPaused: boolean;
  isMenuOpen: boolean;
}

