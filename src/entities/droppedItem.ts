import { TileType } from '../utils/types.js';
import { TILE_SIZE } from '../utils/constants.js';

export class DroppedItem {
  public x: number;
  public y: number;
  public tileType: TileType;
  public pickupDelay: number = 500; // Delay before item can be picked up (ms)
  public spawnTime: number;
  public gemValue: number = 1; // For GEM items, how many gems this represents (1-5)
  private previouslyColliding: boolean = false; // remember if player is/was overlapping

  constructor(x: number, y: number, tileType: TileType, gemValue: number = 1) {
    this.x = x;
    this.y = y;
    this.tileType = tileType;
    this.gemValue = gemValue;
    this.spawnTime = Date.now();
  }

  public canPickup(): boolean {
    return Date.now() - this.spawnTime >= this.pickupDelay;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    // Only render if on screen
    if (screenX < -TILE_SIZE || screenX > ctx.canvas.width + TILE_SIZE ||
        screenY < -TILE_SIZE || screenY > ctx.canvas.height + TILE_SIZE) {
      return;
    }

    // Special rendering for gems
    if (this.tileType === TileType.GEM) {
      // Draw gem as a diamond shape with sparkle
      const size = 20;
      const offset = (TILE_SIZE - size) / 2;
      const centerX = screenX + TILE_SIZE / 2;
      const centerY = screenY + TILE_SIZE / 2;
      
      // Diamond shape
      ctx.fillStyle = '#00CED1'; // Cyan gem color
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size / 2);
      ctx.lineTo(centerX + size / 2, centerY);
      ctx.lineTo(centerX, centerY + size / 2);
      ctx.lineTo(centerX - size / 2, centerY);
      ctx.closePath();
      ctx.fill();
      
      // Highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size / 3);
      ctx.lineTo(centerX + size / 4, centerY - size / 6);
      ctx.lineTo(centerX, centerY);
      ctx.lineTo(centerX - size / 4, centerY - size / 6);
      ctx.closePath();
      ctx.fill();
      
      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Show gem value if > 1
      if (this.gemValue > 1) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.gemValue.toString(), centerX, centerY + size / 2 + 8);
      }
    } else {
      // Draw item as a small block
      const colors: Record<TileType, string> = {
        [TileType.AIR]: '#000',
        [TileType.DIRT]: '#8B4513',
        [TileType.GRASS]: '#228B22',
        [TileType.STONE]: '#808080',
        [TileType.TREE]: '#654321',
        [TileType.WATER]: '#1E90FF',
        [TileType.GOLD_LOCK]: '#FFD700',
        [TileType.BEDROCK]: '#1a1a1a',
        [TileType.SPAWN_DOOR]: '#8B4513',
        [TileType.SIGN]: '#D2691E',
        [TileType.SUPER_STARS]: '#FF0000',
        [TileType.FEDORA]: '#2C2C2C',
        [TileType.SUIT_PANTS]: '#1a1a1a',
      [TileType.SUIT_SHIRT]: '#FFFFFF',
      [TileType.RAINBOW_WINGS]: '#FF1493',
      [TileType.GEM]: '#00CED1', // Cyan for gems (not used, but required for type)
      [TileType.PUNCH]: '#FF6347',
      [TileType.WRENCH]: '#C0C0C0'
    };

      const size = 16; // Smaller than full tile
      const offset = (TILE_SIZE - size) / 2;

      ctx.fillStyle = colors[this.tileType] || '#fff';
      ctx.fillRect(screenX + offset, screenY + offset, size, size);
      
      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + offset, screenY + offset, size, size);
    }
  }

  public checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    // Check if player's hitbox overlaps with item
    const itemCenterX = this.x + TILE_SIZE / 2;
    const itemCenterY = this.y + TILE_SIZE / 2;
    
    const playerLeft = playerX;
    const playerRight = playerX + playerWidth;
    const playerTop = playerY;
    const playerBottom = playerY + playerHeight;

    return itemCenterX >= playerLeft && itemCenterX <= playerRight &&
           itemCenterY >= playerTop && itemCenterY <= playerBottom;
  }

  // Determines if the item should be collected this frame
  public shouldPickup(playerX: number, playerY: number, playerW: number, playerH: number): boolean {
    if (!this.canPickup()) return false;
    const colliding = this.checkCollision(playerX, playerY, playerW, playerH);
    // Only allow pickup if player was NOT colliding in a previous frame (i.e., stepped off then back on)
    const pick = colliding && !this.previouslyColliding;
    this.previouslyColliding = colliding; // update state for next frame
    return pick;
  }
}

