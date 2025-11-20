export declare enum TileType {
    AIR = 0,
    DIRT = 1,
    GRASS = 2,
    STONE = 3,
    TREE = 4,
    WATER = 5,
    GOLD_LOCK = 6,
    BEDROCK = 7,// Unbreakable world border block
    SPAWN_DOOR = 8,// Spawn door marker (unbreakable)
    SIGN = 9,// Sign block with editable text (background block)
    SUPER_STARS = 10,// Red shoes that increase speed by 1.5x
    FEDORA = 11,// Stylish fedora hat (equipable)
    SUIT_PANTS = 12,// Suit pants (equipable)
    SUIT_SHIRT = 13,// Suit shirt (equipable)
    RAINBOW_WINGS = 14,// Rainbow wings (equipable, enables double jump)
    GEM = 15,// Gem currency item (dropped when breaking blocks)
    PUNCH = 99,// Special item for breaking blocks
    WRENCH = 98
}
export interface Tile {
    type: TileType;
    health: number;
    maxHealth: number;
    signText?: string;
}
export interface Item {
    id: string;
    name: string;
    tileType: TileType;
    count: number;
    equipped?: boolean;
}
export interface PlayerData {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    inventory: Item[];
    selectedSlot: number;
    redeemedCodes?: string[];
    equippedShoes?: TileType | null;
    equippedHat?: TileType | null;
    equippedShirt?: TileType | null;
    equippedPants?: TileType | null;
    equippedWings?: TileType | null;
    maxInventorySlots?: number;
    gems?: number;
    username?: string;
}
export interface SignData {
    x: number;
    y: number;
    text: string;
}
export interface WorldData {
    tiles: Tile[][];
    width: number;
    height: number;
    seed: number;
    owner?: string;
    spawnX?: number;
    spawnY?: number;
    signs?: SignData[];
}
export interface GameState {
    world: WorldData;
    player: PlayerData;
    dayTime: number;
    isPaused: boolean;
    isMenuOpen: boolean;
}
//# sourceMappingURL=types.d.ts.map