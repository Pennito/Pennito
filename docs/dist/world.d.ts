import { Tile, TileType, WorldData } from './utils/types.js';
export declare class World {
    private tiles;
    width: number;
    height: number;
    private seed;
    owner: string | null;
    spawnX: number;
    spawnY: number;
    signs: Map<string, string>;
    constructor(width?: number, height?: number, seed?: number);
    private generate;
    getTile(x: number, y: number): Tile | null;
    setTile(x: number, y: number, type: TileType): void;
    damageTile(x: number, y: number, damage: number): boolean;
    isSolid(x: number, y: number): boolean;
    setSignText(x: number, y: number, text: string): void;
    getSignText(x: number, y: number): string | null;
    render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, canvasWidth: number, canvasHeight: number, playerX?: number, playerY?: number, playerW?: number, playerH?: number): void;
    private renderTileWithTexture;
    getWorldData(): WorldData;
    setOwner(username: string | null): void;
    getOwner(): string | null;
    hasGoldLock(): boolean;
    loadWorldData(data: WorldData): void;
}
//# sourceMappingURL=world.d.ts.map