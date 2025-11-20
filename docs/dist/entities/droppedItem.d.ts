import { TileType } from '../utils/types.js';
import { UI } from '../ui.js';
export declare class DroppedItem {
    x: number;
    y: number;
    tileType: TileType;
    pickupDelay: number;
    spawnTime: number;
    gemValue: number;
    private previouslyColliding;
    constructor(x: number, y: number, tileType: TileType, gemValue?: number);
    canPickup(): boolean;
    render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, ui?: UI): void;
    checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean;
    shouldPickup(playerX: number, playerY: number, playerW: number, playerH: number): boolean;
}
//# sourceMappingURL=droppedItem.d.ts.map