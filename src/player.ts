import { TileType, Item, PlayerData } from './utils/types.js';
import { World } from './world.js';
import { 
  PLAYER_WIDTH, 
  PLAYER_HEIGHT, 
  GRAVITY, 
  JUMP_STRENGTH, 
  MOVE_SPEED, 
  MAX_FALL_SPEED,
  TILE_SIZE,
  TILE_HEALTH,
  INVENTORY_SLOTS
} from './utils/constants.js';

export class Player {
  public x: number;
  public y: number;
  public velocityX: number;
  public velocityY: number;
  public width: number;
  public height: number;
  public onGround: boolean;
  public inventory: Item[];
  public selectedSlot: number;
  public username: string;
  public gems: number = 0; // Player's gem currency
  public redeemedCodes: string[] = []; // Track redeemed codes
  public equippedShoes: TileType | null = null; // Currently equipped shoes
  public equippedHat: TileType | null = null; // Currently equipped hat
  public equippedPants: TileType | null = null; // Currently equipped pants
  public equippedShirt: TileType | null = null; // Currently equipped shirt
  public equippedWings: TileType | null = null; // Currently equipped wings (enables double jump)
  public equippedSword: TileType | null = null; // Currently equipped sword (affects breaking speed and gem drops)
  public maxInventorySlots: number = INVENTORY_SLOTS; // Expandable inventory (starts at 8, max 50)
  private animationFrame: number = 0;
  private lastMoveTime: number = 0;
  private isMoving: boolean = false;
  private jumpCount: number = 0; // Track jumps for double jump (0 = no jump, 1 = first jump, 2 = double jump used)
  private doubleJumpCooldown: number = 0; // Cooldown timer after second jump (in ms)
  private lastCooldownUpdate: number = 0; // Track time for cooldown updates
  private readonly DOUBLE_JUMP_COOLDOWN_MS = 500; // 0.5 seconds cooldown

  constructor(x: number, y: number, username: string = 'Player', maxSlots: number = INVENTORY_SLOTS) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.onGround = false;
    this.selectedSlot = 0;
    this.username = username;
    this.maxInventorySlots = maxSlots;
    this.inventory = this.initializeInventory(maxSlots);
    this.lastMoveTime = Date.now();
  }

  private initializeInventory(maxSlots: number = INVENTORY_SLOTS): Item[] {
    const inventory: Item[] = [
      { id: 'punch', name: 'Punch', tileType: TileType.PUNCH, count: 1 }, // Always have punch
      { id: 'wrench', name: 'Wrench', tileType: TileType.WRENCH, count: 1 } // Always have wrench
    ];
    
    // Fill remaining slots with empty items
    for (let i = inventory.length; i < maxSlots; i++) {
      inventory.push({
        id: `empty_${i}`,
        name: 'Empty',
        tileType: TileType.AIR,
        count: 0
      });
    }
    
    return inventory;
  }
  
  // Ensure inventory array matches maxInventorySlots
  public ensureInventorySize(): void {
    while (this.inventory.length < this.maxInventorySlots) {
      this.inventory.push({
        id: `empty_${this.inventory.length}`,
        name: 'Empty',
        tileType: TileType.AIR,
        count: 0
      });
    }
    // Trim if somehow over (shouldn't happen, but safety check)
    if (this.inventory.length > this.maxInventorySlots) {
      this.inventory = this.inventory.slice(0, this.maxInventorySlots);
    }
  }

  private prevJumpHeld: boolean = false; // whether jump key was held last frame
  private lastJumpTime: number = 0; // timestamp of last successful jump

  private getCurrentMoveSpeed(): number {
    let speed = MOVE_SPEED;
    // Super Stars give 1.5x speed boost
    if (this.equippedShoes === TileType.SUPER_STARS) {
      speed *= 1.5;
    }
    return speed;
  }

  // jumpHeld = current state of jump key (true while key is held)
  public update(world: World, moveLeft: boolean, moveRight: boolean, jumpHeld: boolean): void {
    const currentSpeed = this.getCurrentMoveSpeed();
    
    // Horizontal movement
    this.velocityX = 0;
    this.isMoving = false;
    if (moveLeft) {
      this.velocityX = -currentSpeed;
      this.isMoving = true;
    }
    if (moveRight) {
      this.velocityX = currentSpeed;
      this.isMoving = true;
    }
    
    // Update animation
    if (this.isMoving) {
      this.lastMoveTime = Date.now();
    }

    // Check if player is on ground (before jump check)
    this.onGround = this.checkOnGround(world);
    
    // Update cooldown timer (only for double jump)
    const now = Date.now();
    if (this.doubleJumpCooldown > 0 && this.lastCooldownUpdate > 0) {
      const deltaTime = now - this.lastCooldownUpdate;
      this.doubleJumpCooldown = Math.max(0, this.doubleJumpCooldown - deltaTime);
    }
    this.lastCooldownUpdate = now;
    
    // Reset jump count and cooldown when on ground
    if (this.onGround) {
      this.jumpCount = 0;
      this.doubleJumpCooldown = 0;
    }

    // Edge-triggered jump: only fire when key transitions from up->down
    const justPressed = jumpHeld && !this.prevJumpHeld;
    const jumpCooldown = 200; // ms between jumps (prevents spam)

    if (justPressed && (now - this.lastJumpTime) >= jumpCooldown) {
      // Normal jump: on ground (works for everyone)
      if (this.onGround) {
        this.velocityY = JUMP_STRENGTH;
        this.onGround = false;
        this.lastJumpTime = now;
        this.jumpCount = 1;
        console.log('[JUMP] Normal jump from ground');
      }
      // Double jump: ONLY if wings are equipped AND in air (Growtopia-style)
      else if (!this.onGround && this.jumpCount === 1 && this.doubleJumpCooldown === 0) {
        // Check if wings are equipped
        if (this.equippedWings === TileType.RAINBOW_WINGS) {
          // Double jump allowed with wings
          this.velocityY = JUMP_STRENGTH;
          this.lastJumpTime = now;
          this.jumpCount = 2;
          this.doubleJumpCooldown = this.DOUBLE_JUMP_COOLDOWN_MS;
          console.log('[JUMP] Double jump with Rainbow Wings!');
        }
        // If no wings, do nothing (can't double jump)
      }
    }
    // Save key state for next frame
    this.prevJumpHeld = jumpHeld;

    // Apply gravity
    this.velocityY += GRAVITY;
    if (this.velocityY > MAX_FALL_SPEED) {
      this.velocityY = MAX_FALL_SPEED;
    }

    // Horizontal collision - check if we can move horizontally
    const nextX = this.x + this.velocityX;
    const worldMaxX = (world.width * TILE_SIZE) - this.width;
    
    // Clamp to world bounds (invisible walls)
    if (nextX < 0) {
      this.x = 0;
      this.velocityX = 0;
    } else if (nextX > worldMaxX) {
      this.x = worldMaxX;
      this.velocityX = 0;
    } else if (!this.checkCollision(world, nextX, this.y)) {
      this.x = nextX;
    } else {
      // Can't move horizontally - snap to tile boundary
      if (this.velocityX > 0) {
        // Moving right - snap to left edge of blocking tile
        const blockingTileX = Math.floor((nextX + this.width) / TILE_SIZE);
        this.x = blockingTileX * TILE_SIZE - this.width;
      } else if (this.velocityX < 0) {
        // Moving left - snap to right edge of blocking tile
        const blockingTileX = Math.floor(nextX / TILE_SIZE);
        this.x = (blockingTileX + 1) * TILE_SIZE;
      }
      this.velocityX = 0;
    }

    // Vertical collision - check if we can move vertically
    const nextY = this.y + this.velocityY;
    if (!this.checkCollision(world, this.x, nextY)) {
      this.y = nextY;
      // Update ground status after moving
      this.onGround = this.checkOnGround(world);
    } else {
      // Hit something vertically
      if (this.velocityY > 0) {
        // Hit ground - snap to top of block
        const groundTileY = Math.floor((nextY + this.height) / TILE_SIZE);
        this.y = groundTileY * TILE_SIZE - this.height;
        this.onGround = true;
        this.velocityY = 0;
      } else {
        // Hit ceiling - snap to bottom of block
        const ceilingTileY = Math.floor(nextY / TILE_SIZE);
        this.y = (ceilingTileY + 1) * TILE_SIZE;
        this.velocityY = 0;
      }
    }
  }

  private checkOnGround(world: World): boolean {
    const playerBottomY = this.y + this.height;
    const tileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
    const tileY = Math.floor(playerBottomY / TILE_SIZE);
    
    // Check if there's a solid block directly below the player
    if (world.isSolid(tileX, tileY)) {
      const blockTopY = tileY * TILE_SIZE;
      const distanceToBlockTop = playerBottomY - blockTopY;
      // Allow small tolerance for floating point errors (3 pixels)
      return distanceToBlockTop >= -3 && distanceToBlockTop <= 3;
    }
    
    return false;
  }

  private checkCollision(world: World, x: number, y: number): boolean {
    // Collision detection for player (32x32, exactly one block)
    // Since player is exactly 32x32, check the tile they occupy
    
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    // Check if the tile the player occupies is solid
    if (world.isSolid(tileX, tileY)) {
      return true;
    }
    
    // Since player is exactly 32x32, if x or y is not aligned to tile grid,
    // we need to check adjacent tiles
    const rightTileX = Math.floor((x + this.width - 1) / TILE_SIZE);
    const bottomTileY = Math.floor((y + this.height - 1) / TILE_SIZE);
    
    // Check if player extends into adjacent tiles
    if (rightTileX !== tileX && world.isSolid(rightTileX, tileY)) {
      return true;
    }
    if (bottomTileY !== tileY && world.isSolid(tileX, bottomTileY)) {
      return true;
    }
    if (rightTileX !== tileX && bottomTileY !== tileY && world.isSolid(rightTileX, bottomTileY)) {
      return true;
    }
    
    return false;
  }

  public getSelectedItem(): Item | null {
    if (this.selectedSlot >= 0 && this.selectedSlot < this.inventory.length) {
      const item = this.inventory[this.selectedSlot];
      return item.count > 0 ? item : null;
    }
    return null;
  }

  public addToInventory(tileType: TileType, count: number = 1): void {
    // Find existing item of this type
    const existingItem = this.inventory.find(item => item.tileType === tileType);
    if (existingItem) {
      existingItem.count += count;
    } else {
      // Find first empty slot
      const emptySlot = this.inventory.findIndex(item => item.tileType === TileType.AIR || item.count === 0);
      if (emptySlot !== -1) {
        const tileNames: Record<TileType, string> = {
          [TileType.AIR]: 'Air',
          [TileType.DIRT]: 'Dirt',
          [TileType.GRASS]: 'Grass',
          [TileType.STONE]: 'Stone',
          [TileType.TREE]: 'Tree',
          [TileType.WATER]: 'Water',
          [TileType.GOLD_LOCK]: 'Gold Lock',
          [TileType.BEDROCK]: 'Bedrock',
          [TileType.SPAWN_DOOR]: 'Spawn Door',
          [TileType.SIGN]: 'Sign',
          [TileType.SUPER_STARS]: 'Super Stars',
          [TileType.FEDORA]: 'Fedora',
          [TileType.SUIT_PANTS]: 'Suit Pants',
          [TileType.SUIT_SHIRT]: 'Suit Shirt',
          [TileType.RAINBOW_WINGS]: 'Rainbow Wings',
          [TileType.GEM]: 'Gem',
          [TileType.FLAME_SWORD]: 'Flame Sword',
          [TileType.PUNCH]: 'Punch',
          [TileType.WRENCH]: 'Wrench'
        };
        this.inventory[emptySlot] = {
          id: TileType[tileType].toLowerCase(),
          name: tileNames[tileType],
          tileType,
          count
        };
      }
    }
  }

  public useFromInventory(tileType: TileType): boolean {
    const item = this.getSelectedItem();
    if (item && item.tileType === tileType && item.count > 0) {
      // PUNCH and WRENCH items should never decrease in count
      if (item.tileType === TileType.PUNCH || item.tileType === TileType.WRENCH) {
        return true;
      }
      
      item.count--;
      if (item.count <= 0) {
        item.tileType = TileType.AIR;
        item.name = 'Empty';
      }
      return true;
    }
    return false;
  }

  public getInventoryExpansionCost(): number {
    // Cost doubles each time: 50, 100, 200, 400, etc.
    const expansions = (this.maxInventorySlots - INVENTORY_SLOTS) / 2;
    return 50 * Math.pow(2, expansions);
  }

  public expandInventory(): boolean {
    if (this.maxInventorySlots >= 50) {
      return false; // Already at max
    }
    
    const cost = this.getInventoryExpansionCost();
    if (this.gems < cost) {
      return false; // Not enough gems
    }
    
    this.gems -= cost;
    this.maxInventorySlots += 2;
    
    // Ensure inventory array matches new size
    this.ensureInventorySize();
    
    return true;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, worldOwner: string | null = null): void {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    // Player shadow (ellipse)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      screenX + this.width / 2,
      screenY + this.height + 1,
      this.width / 2 + 2,
      3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Animation timing
    const timeSinceMove = Date.now() - this.lastMoveTime;
    if (this.isMoving && timeSinceMove < 100) {
      this.animationFrame = Math.floor((Date.now() / 200) % 2); // 2-frame cycle like Growtopia
    } else {
      this.animationFrame = 0;
    }

    // Walk animation offset
    const walkOffset = this.isMoving ? (this.animationFrame === 0 ? -3 : 3) : 0;
    const armSwing = this.isMoving ? (this.animationFrame === 0 ? -2 : 2) : 0;
    
    // === GROWTOPIA-STYLE CHARACTER ===
    
    // BACK ARM (drawn first, behind body) - NAKED (skin color)
    const backArmX = screenX + (this.velocityX < 0 ? this.width - 2 : -3);
    ctx.fillStyle = '#ffd4a3'; // Skin tone
    ctx.fillRect(backArmX, screenY + 8 - armSwing, 3, 12);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(backArmX, screenY + 8 - armSwing, 3, 12);
    
    // BACK HAND (at end of back arm) - more visible
    const backHandY = screenY + 8 - armSwing + 12;
    ctx.fillStyle = '#ffd4a3'; // Skin tone
    ctx.fillRect(backArmX - 1, backHandY, 5, 4); // Larger hand (5x4 instead of 3x2)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(backArmX - 1, backHandY, 5, 4);
    // Fingers detail
    ctx.fillStyle = '#f0c090'; // Slightly darker for depth
    ctx.fillRect(backArmX, backHandY + 1, 1, 2);
    ctx.fillRect(backArmX + 2, backHandY + 1, 1, 2);
    ctx.fillRect(backArmX + 4, backHandY + 1, 1, 2);
    
    // BACK LEG (drawn behind body) - NAKED (skin color)
    const backLegX = screenX + (this.velocityX < 0 ? this.width - 6 : 3);
    ctx.fillStyle = '#ffd4a3'; // Skin tone
    ctx.fillRect(backLegX - walkOffset, screenY + 20, 5, 10);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(backLegX - walkOffset, screenY + 20, 5, 10);
    
    // BODY (rectangular like Growtopia) - NAKED (skin color) or SUIT SHIRT
    if (this.equippedShirt === TileType.SUIT_SHIRT) {
      // WHITE SUIT SHIRT - Make it more visible
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(screenX + 2, screenY + 8, this.width - 4, 13);
      // Shirt outline for visibility
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX + 2, screenY + 8, this.width - 4, 13);
      // Collar (more visible)
      ctx.fillStyle = '#E8E8E8';
      ctx.fillRect(screenX + 3, screenY + 8, this.width - 6, 5);
      // Buttons (more visible)
      ctx.fillStyle = '#808080';
      ctx.fillRect(screenX + this.width / 2 - 2, screenY + 11, 4, 3);
      ctx.fillRect(screenX + this.width / 2 - 2, screenY + 14, 4, 3);
      ctx.fillRect(screenX + this.width / 2 - 2, screenY + 17, 4, 3);
      // Tie (optional detail)
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX + this.width / 2 - 1, screenY + 10, 2, 8);
    } else {
      // NAKED BODY (skin color)
      ctx.fillStyle = '#ffd4a3'; // Skin tone
      ctx.fillRect(screenX + 2, screenY + 8, this.width - 4, 13);
      // Body shading (slight darker tone for depth)
      ctx.fillStyle = '#f0c090';
      ctx.fillRect(screenX + 2, screenY + 18, this.width - 4, 3);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + 2, screenY + 8, this.width - 4, 13);
    }
    
    // FRONT LEG - NAKED (skin color) or SUIT PANTS
    const frontLegX = screenX + (this.velocityX < 0 ? 3 : this.width - 6);
    if (this.equippedPants === TileType.SUIT_PANTS) {
      // BLACK SUIT PANTS - Make more visible
      ctx.fillStyle = '#000000'; // Pure black for visibility
      ctx.fillRect(frontLegX + walkOffset, screenY + 20, 5, 10);
      // Pants crease/line
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(frontLegX + walkOffset + 2.5, screenY + 20);
      ctx.lineTo(frontLegX + walkOffset + 2.5, screenY + 30);
      ctx.stroke();
      // Outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(frontLegX + walkOffset, screenY + 20, 5, 10);
    } else {
      // NAKED LEG (skin color)
      ctx.fillStyle = '#ffd4a3'; // Skin tone
      ctx.fillRect(frontLegX + walkOffset, screenY + 20, 5, 10);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(frontLegX + walkOffset, screenY + 20, 5, 10);
    }
    
    // BACK LEG - also render pants if equipped (redraw over the back leg)
    if (this.equippedPants === TileType.SUIT_PANTS) {
      ctx.fillStyle = '#000000'; // Pure black for visibility
      ctx.fillRect(backLegX - walkOffset, screenY + 20, 5, 10);
      // Pants crease/line
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(backLegX - walkOffset + 2.5, screenY + 20);
      ctx.lineTo(backLegX - walkOffset + 2.5, screenY + 30);
      ctx.stroke();
      // Outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(backLegX - walkOffset, screenY + 20, 5, 10);
    }
    
    // FEET - Render naked or equipped shoes
    if (this.equippedShoes === TileType.SUPER_STARS) {
      // RED SHOES (Super Stars)
      ctx.fillStyle = '#C41E3A'; // Deep red
      // Back shoe
      ctx.fillRect(backLegX - walkOffset, screenY + 28, 5, 3);
      // Front shoe
      ctx.fillRect(frontLegX + walkOffset, screenY + 28, 5, 3);
      
      // White soles
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(backLegX - walkOffset, screenY + 30, 5, 1);
      ctx.fillRect(frontLegX + walkOffset, screenY + 30, 5, 1);
      
      // Gold star detail
      ctx.fillStyle = '#FFD700';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', backLegX - walkOffset + 2, screenY + 29);
      ctx.fillText('⭐', frontLegX + walkOffset + 2, screenY + 29);
    } else {
      // NAKED FEET (skin color, no shoes)
      ctx.fillStyle = '#ffd4a3'; // Skin tone
      // Back foot
      ctx.fillRect(backLegX - walkOffset, screenY + 29, 5, 2);
      // Front foot
      ctx.fillRect(frontLegX + walkOffset, screenY + 29, 5, 2);
    }
    
    // HEAD (larger, blocky like Growtopia)
    const headWidth = 16;
    const headHeight = 12;
    const headX = screenX + (this.width - headWidth) / 2;
    const headY = screenY - 4;
    
    // Head base (skin color) - BALD by default
    ctx.fillStyle = '#ffd4a3';
    ctx.fillRect(headX, headY, headWidth, headHeight);
    
    // Face features
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(headX + 3, headY + 5, 4, 4);
    ctx.fillRect(headX + 9, headY + 5, 4, 4);
    
    // Eye direction
    ctx.fillStyle = '#000';
    const pupilOffsetX = this.velocityX < 0 ? 0 : (this.velocityX > 0 ? 2 : 1);
    ctx.fillRect(headX + 4 + pupilOffsetX, headY + 6, 2, 2);
    ctx.fillRect(headX + 10 + pupilOffsetX, headY + 6, 2, 2);
    
    // Simple smile
    ctx.fillStyle = '#000';
    ctx.fillRect(headX + 4, headY + 10, 1, 1);
    ctx.fillRect(headX + 5, headY + 10, 6, 1);
    ctx.fillRect(headX + 11, headY + 10, 1, 1);
    
    // Head outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(headX, headY, headWidth, headHeight);
    
    // FRONT ARM (drawn last, in front of body)
    const frontArmX = screenX + (this.velocityX < 0 ? -3 : this.width - 2);
    ctx.fillStyle = '#ffd4a3'; // Skin tone
    ctx.fillRect(frontArmX, screenY + 8 + armSwing, 3, 12);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(frontArmX, screenY + 8 + armSwing, 3, 12);
    
    // FRONT HAND (at end of front arm) - more visible
    const frontHandY = screenY + 8 + armSwing + 12;
    ctx.fillStyle = '#ffd4a3'; // Skin tone
    ctx.fillRect(frontArmX - 1, frontHandY, 5, 4); // Larger hand (5x4 instead of 3x2)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(frontArmX - 1, frontHandY, 5, 4);
    // Fingers detail
    ctx.fillStyle = '#f0c090'; // Slightly darker for depth
    ctx.fillRect(frontArmX, frontHandY + 1, 1, 2);
    ctx.fillRect(frontArmX + 2, frontHandY + 1, 1, 2);
    ctx.fillRect(frontArmX + 4, frontHandY + 1, 1, 2);
    
    // FEDORA HAT (if equipped) - rendered ABOVE the head
    if (this.equippedHat === TileType.FEDORA) {
      const hatY = screenY - 8; // Position above head (not part of hitbox)
      const hatX = screenX + this.width / 2;
      
      // Hat brim (wider oval)
      ctx.fillStyle = '#2C2C2C'; // Dark gray/black
      ctx.beginPath();
      ctx.ellipse(hatX, hatY + 8, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Hat crown (main body)
      ctx.fillStyle = '#1C1C1C'; // Slightly darker
      ctx.fillRect(hatX - 7, hatY - 4, 14, 12);
      
      // Hat top (rounded)
      ctx.fillStyle = '#2C2C2C';
      ctx.beginPath();
      ctx.ellipse(hatX, hatY - 4, 7, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Hat band (red stripe)
      ctx.fillStyle = '#8B0000'; // Dark red
      ctx.fillRect(hatX - 7, hatY + 7, 14, 2);
    }
    
    // RAINBOW WINGS (if equipped) - rendered behind player
    if (this.equippedWings === TileType.RAINBOW_WINGS) {
      const wingX = screenX + this.width / 2;
      const wingY = screenY + 12; // Middle of body
      
      // Left wing
      ctx.fillStyle = '#FF1493'; // Pink/magenta base
      ctx.beginPath();
      ctx.ellipse(wingX - 12, wingY, 8, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Rainbow gradient effect
      ctx.fillStyle = '#FF69B4';
      ctx.beginPath();
      ctx.ellipse(wingX - 12, wingY - 1, 6, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF1493';
      ctx.beginPath();
      ctx.ellipse(wingX - 12, wingY + 1, 6, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Right wing
      ctx.fillStyle = '#FF1493';
      ctx.beginPath();
      ctx.ellipse(wingX + 12, wingY, 8, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Rainbow gradient effect
      ctx.fillStyle = '#FF69B4';
      ctx.beginPath();
      ctx.ellipse(wingX + 12, wingY - 1, 6, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF1493';
      ctx.beginPath();
      ctx.ellipse(wingX + 12, wingY + 1, 6, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // USERNAME above head/hat (green if owner, white if not)
    // Trim and compare usernames to avoid whitespace issues
    const isOwner = worldOwner && worldOwner.trim() === this.username.trim();
    ctx.fillStyle = isOwner ? '#00FF00' : '#FFFFFF'; // Green for owner, white for others
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    // Text shadow for readability
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const usernameY = this.equippedHat === TileType.FEDORA ? screenY - 17 : screenY - 5;
    ctx.strokeText(this.username, screenX + this.width / 2, usernameY);
    ctx.fillText(this.username, screenX + this.width / 2, usernameY);
  }

  public getPlayerData(): PlayerData {
    return {
      x: this.x,
      y: this.y,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      inventory: this.inventory.map(item => ({ ...item })),
      selectedSlot: this.selectedSlot,
      equippedShoes: this.equippedShoes,
      equippedHat: this.equippedHat,
      equippedShirt: this.equippedShirt,
      equippedPants: this.equippedPants,
      equippedWings: this.equippedWings,
      equippedSword: this.equippedSword,
      maxInventorySlots: this.maxInventorySlots,
      gems: this.gems,
      redeemedCodes: this.redeemedCodes
    };
  }

  public loadPlayerData(data: PlayerData): void {
    this.x = data.x;
    this.y = data.y;
    this.velocityX = data.velocityX;
    this.velocityY = data.velocityY;
    this.selectedSlot = data.selectedSlot;
    this.equippedShoes = data.equippedShoes || null;
    this.equippedHat = data.equippedHat || null;
    this.equippedShirt = data.equippedShirt || null;
    this.equippedPants = data.equippedPants || null;
    this.equippedWings = data.equippedWings || null;
    this.equippedSword = data.equippedSword || null;
    this.maxInventorySlots = data.maxInventorySlots || INVENTORY_SLOTS;
    this.gems = data.gems || 0;
    this.redeemedCodes = data.redeemedCodes || [];
    
    // Load inventory and ensure it matches maxInventorySlots
    this.inventory = data.inventory ? data.inventory.map(item => ({ ...item })) : this.initializeInventory(this.maxInventorySlots);
    this.ensureInventorySize();
  }
}

