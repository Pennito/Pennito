import { Tile, TileType, WorldData } from './utils/types.js';
import { WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, TILE_HEALTH, TILE_COLORS } from './utils/constants.js';

export class World {
  private tiles: Tile[][];
  public width: number;
  public height: number;
  private seed: number;
  public owner: string | null = null; // World owner username (if gold lock is placed)
  public spawnX: number = 0; // Spawn door X position (in tiles)
  public spawnY: number = 0; // Spawn door Y position (in tiles)
  public signs: Map<string, string> = new Map(); // Sign text data (key: "x,y", value: text)

  constructor(width: number = WORLD_WIDTH, height: number = WORLD_HEIGHT, seed?: number) {
    this.width = width;
    this.height = height;
    this.seed = seed || Math.random() * 1000000;
    this.tiles = [];
    this.generate();
  }

  private generate(): void {
    // NEW WORLD GENERATION: 50x50 with clear boundaries and spawn door
    // - Bottom row (y=49) = BEDROCK (unbreakable floor)
    // - Terrain generates from y=25 downward
    // - Top area (y=0-24) = open air for building
    // - SPAWN DOOR at center top with bedrock platform below
    
    // Set spawn door location (middle of world, near terrain level)
    this.spawnX = Math.floor(this.width / 2);
    this.spawnY = 23; // Just above terrain level (terrain starts at ~y=25)
    
    for (let x = 0; x < this.width; x++) {
      this.tiles[x] = [];
      
      // Add some terrain variation with noise
      const noise = Math.sin(x * 0.15 + this.seed) * 2;
      const terrainStart = 25 + Math.floor(noise); // Start around y=25
      
      for (let y = 0; y < this.height; y++) {
        let type: TileType;
        let health: number;
        
        // SPAWN DOOR: Single block at spawn location (looks like 2 blocks when rendered)
        if (x === this.spawnX && y === this.spawnY) {
          type = TileType.SPAWN_DOOR;
        }
        // SPAWN PLATFORM: Bedrock directly below spawn door
        else if (x === this.spawnX && y === this.spawnY + 1) {
          type = TileType.BEDROCK;
        }
        // Bottom row = BEDROCK (unbreakable world limit)
        else if (y === this.height - 1) {
          type = TileType.BEDROCK;
        } 
        // Air above terrain (for building)
        else if (y < terrainStart) {
          type = TileType.AIR;
        } 
        // Grass at surface
        else if (y === terrainStart) {
          type = TileType.GRASS;
        } 
        // Dirt layer below grass
        else if (y < terrainStart + 4) {
          type = TileType.DIRT;
        } 
        // Stone deeper underground
        else {
          type = TileType.STONE;
        }
        
        health = TILE_HEALTH[type];
        this.tiles[x][y] = {
          type,
          health,
          maxHealth: health
        };
      }
    }
    
    console.log(`[WORLD] Spawn door created at (${this.spawnX}, ${this.spawnY})`);
  }

  public getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[x][y];
  }

  public setTile(x: number, y: number, type: TileType): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    
    const health = TILE_HEALTH[type];
    this.tiles[x][y] = {
      type,
      health,
      maxHealth: health
    };
  }

  public damageTile(x: number, y: number, damage: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile || tile.type === TileType.AIR) {
      return false;
    }
    
    // BEDROCK and SPAWN_DOOR are unbreakable
    if (tile.type === TileType.BEDROCK || tile.type === TileType.SPAWN_DOOR) {
      console.log('[WORLD] Cannot break unbreakable tile:', TileType[tile.type]);
      return false;
    }
    
    tile.health -= damage;
    if (tile.health <= 0) {
      this.setTile(x, y, TileType.AIR);
      return true; // Tile broken
    }
    return false;
  }

  public isSolid(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return true; // Out of bounds is solid
    // SPAWN_DOOR and SIGN are pass-through (not solid), like AIR
    return tile.type !== TileType.AIR && 
           tile.type !== TileType.WATER && 
           tile.type !== TileType.SPAWN_DOOR &&
           tile.type !== TileType.SIGN;
  }
  
  public setSignText(x: number, y: number, text: string): void {
    const tile = this.getTile(x, y);
    if (tile && tile.type === TileType.SIGN) {
      // Update the tile's signText property (for rendering)
      tile.signText = text.substring(0, 20);
      
      // Also store in Map for saving/loading
      const key = `${x},${y}`;
      if (text.trim()) {
        this.signs.set(key, text.substring(0, 20));
      } else {
        this.signs.delete(key);
      }
    }
  }
  
  public getSignText(x: number, y: number): string | null {
    const tile = this.getTile(x, y);
    if (tile && tile.type === TileType.SIGN) {
      return tile.signText || null;
    }
    return null;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, canvasWidth: number, canvasHeight: number, playerX?: number, playerY?: number, playerW?: number, playerH?: number): void {
    const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const endX = Math.min(this.width, Math.ceil((cameraX + canvasWidth) / TILE_SIZE));
    const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endY = Math.min(this.height, Math.ceil((cameraY + canvasHeight) / TILE_SIZE));

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const tile = this.tiles[x][y];
        if (tile && tile.type !== TileType.AIR) {
          const screenX = x * TILE_SIZE - cameraX;
          const screenY = y * TILE_SIZE - cameraY;
          
          // Special rendering for SPAWN_DOOR
          if (tile.type === TileType.SPAWN_DOOR) {
            // Draw door frame (brown wood)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            
            // Draw door panels
            ctx.fillStyle = '#654321';
            ctx.fillRect(screenX + 4, screenY + 4, 12, TILE_SIZE - 8);
            ctx.fillRect(screenX + 16, screenY + 4, 12, TILE_SIZE - 8);
            
            // Draw door handle
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(screenX + 8, screenY + TILE_SIZE / 2 - 2, 4, 4);
            
            // Draw border
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
          // Special rendering for SIGN
          else if (tile.type === TileType.SIGN) {
            // Draw sign background (light brown wood)
            ctx.fillStyle = TILE_COLORS[TileType.SIGN];
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            
            // Draw sign frame
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            
            // Draw a small icon/symbol to indicate it's a sign
            ctx.fillStyle = '#654321';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📝', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
            
            // Only show text if player is overlapping/near the sign
            if (tile.signText && tile.signText.length > 0 && 
                playerX !== undefined && playerY !== undefined && 
                playerW !== undefined && playerH !== undefined) {
              
              // Check if player is touching/overlapping this sign tile
              const tileLeft = x * TILE_SIZE;
              const tileRight = tileLeft + TILE_SIZE;
              const tileTop = y * TILE_SIZE;
              const tileBottom = tileTop + TILE_SIZE;
              
              const playerRight = playerX + playerW;
              const playerBottom = playerY + playerH;
              
              // AABB collision check
              const isPlayerNear = !(
                tileRight < playerX ||
                tileLeft > playerRight ||
                tileBottom < playerY ||
                tileTop > playerBottom
              );
              
              if (isPlayerNear) {
                // Draw text above the sign as a tooltip
                const text = tile.signText.substring(0, 20);
                
                // Draw tooltip background
                const tooltipPadding = 8;
                const tooltipHeight = 24;
                const textWidth = ctx.measureText(text).width;
                const tooltipWidth = textWidth + tooltipPadding * 2;
                const tooltipX = screenX + TILE_SIZE / 2 - tooltipWidth / 2;
                const tooltipY = screenY - tooltipHeight - 8;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
                
                // Border
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
                
                // Text
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, screenX + TILE_SIZE / 2, tooltipY + tooltipHeight / 2);
              }
            }
            
            // Draw border
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            // Enhanced tile rendering with textures
            this.renderTileWithTexture(ctx, tile.type, screenX, screenY);
            
            // Draw health bar if damaged
            if (tile.health < tile.maxHealth && tile.maxHealth > 0) {
              const healthPercent = tile.health / tile.maxHealth;
              ctx.fillStyle = '#ff0000';
              ctx.fillRect(screenX, screenY - 4, TILE_SIZE, 2);
              ctx.fillStyle = '#00ff00';
              ctx.fillRect(screenX, screenY - 4, TILE_SIZE * healthPercent, 2);
            }
          }
        }
      }
    }
  }

  private renderTileWithTexture(ctx: CanvasRenderingContext2D, type: TileType, x: number, y: number): void {
    const size = TILE_SIZE;
    
    switch (type) {
      case TileType.DIRT:
        // Dirt with particles
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, size, size);
        // Add texture dots
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 12; i++) {
          const dx = (i * 7) % size;
          const dy = Math.floor((i * 7) / size) * 8;
          ctx.fillRect(x + dx, y + dy, 2, 2);
        }
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
        
      case TileType.GRASS:
        // Grass with green top
        ctx.fillStyle = '#8B4513'; // Dirt base
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#228B22'; // Grass top
        ctx.fillRect(x, y, size, 8);
        // Grass blades
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(x + i * 5 + 2, y, 2, 4);
        }
        ctx.strokeStyle = '#1a6b1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
        
      case TileType.STONE:
        // Stone with cracks
        ctx.fillStyle = '#696969';
        ctx.fillRect(x, y, size, size);
        // Lighter areas
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + 4, y + 4, 8, 8);
        ctx.fillRect(x + 16, y + 12, 10, 10);
        // Dark cracks
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x + 10, y + 8, 2, 16);
        ctx.fillRect(x + 8, y + 16, 16, 2);
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
        
      case TileType.TREE:
        // Wood log with rings
        ctx.fillStyle = '#654321';
        ctx.fillRect(x, y, size, size);
        // Wood grain
        ctx.fillStyle = '#8B6914';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x, y + i * 8, size, 2);
        }
        // Tree ring
        ctx.strokeStyle = '#4a2a0a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
        
      case TileType.WATER:
        // Animated water
        const time = Date.now() / 1000;
        const wave = Math.sin(time * 2) * 0.2;
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(x, y, size, size);
        // Wave effect
        ctx.fillStyle = 'rgba(135, 206, 250, 0.5)';
        ctx.fillRect(x, y + 8 + wave * 4, size, 4);
        ctx.fillRect(x, y + 20 + wave * 4, size, 4);
        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 4, y + 4, 8, 2);
        ctx.strokeStyle = '#2E5090';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
        
      case TileType.GOLD_LOCK:
        // Gold lock with shine
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x, y, size, size);
        // Lock shackle
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + 10, 6, Math.PI, 0);
        ctx.stroke();
        // Lock body
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(x + 8, y + 14, 16, 14);
        // Keyhole
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + size / 2, y + 20, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + size / 2 - 1, y + 20, 2, 6);
        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(x + 4, y + 4, 6, 6);
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
        
      case TileType.BEDROCK:
        // Unbreakable bedrock pattern
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, size, size);
        // Darker spots
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x + 4, y + 4, 8, 8);
        ctx.fillRect(x + 20, y + 20, 8, 8);
        ctx.fillRect(x + 12, y + 16, 8, 8);
        // Lighter cracks
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x + 8, y, size - 16, 2);
        ctx.fillRect(x, y + 8, 2, size - 16);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
        break;
        
      default:
        // Fallback to solid color
        ctx.fillStyle = TILE_COLORS[type] || '#fff';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
    }
  }

  public getWorldData(): WorldData {
    return {
      tiles: this.tiles.map(col => col.map(tile => ({ ...tile }))),
      width: this.width,
      height: this.height,
      seed: this.seed,
      owner: this.owner || undefined
    };
  }
  
  public setOwner(username: string | null): void {
    this.owner = username;
  }
  
  public getOwner(): string | null {
    return this.owner;
  }
  
  
  public hasGoldLock(): boolean {
    // Check if any tile in the world is a gold lock
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.tiles[x][y].type === TileType.GOLD_LOCK) {
          return true;
        }
      }
    }
    return false;
  }

  public loadWorldData(data: WorldData): void {
    this.width = data.width;
    this.height = data.height;
    this.seed = data.seed;
    this.owner = data.owner || null;
    this.tiles = data.tiles.map(col => col.map(tile => ({ ...tile })));
  }
}

