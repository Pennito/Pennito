import { Item, TileType } from './utils/types.js';
import { TILE_COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, INVENTORY_SLOTS } from './utils/constants.js';
import { getSkyColor } from './utils/utils.js';

export class UI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hoveredSlot: number = -1;
  private tooltipItem: Item | null = null;
  private tooltipX: number = 0;
  private tooltipY: number = 0;
  private inventoryExpanded: boolean = false; // Whether inventory is expanded (pulled up)
  private inventoryExpansionTarget: number = 0; // Target expansion height (0 = collapsed, 1 = expanded)
  private inventoryExpansionCurrent: number = 0; // Current expansion height (for smooth animation)

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.updateHover(x, y);
    });

    // Note: Inventory expansion is now handled in GameScreen.handleUIClick
    // to prevent conflicts with slot selection
  }

  public isInventoryExpanded(): boolean {
    return this.inventoryExpanded;
  }

  public toggleInventoryExpansion(): void {
    this.inventoryExpanded = !this.inventoryExpanded;
    this.inventoryExpansionTarget = this.inventoryExpanded ? 1 : 0;
    console.log(`[INVENTORY] Toggled expansion: ${this.inventoryExpanded}`);
  }

  public checkExpandButtonClick(x: number, y: number, maxSlots: number): boolean {
    // Check if click is on the expand/collapse indicator button
    const slotsPerRow = 8;
    const maxRows = Math.ceil(maxSlots / slotsPerRow);
    if (maxRows <= 1) return false; // No expand button if only one row
    
    const baseY = CANVAS_HEIGHT - 80;
    const indicatorY = baseY - 5;
    const indicatorHeight = 20;
    
    // Check if click is in the expand/collapse button area (centered text area)
    const buttonWidth = 300;
    const buttonX = (CANVAS_WIDTH - buttonWidth) / 2;
    
    return x >= buttonX && x <= buttonX + buttonWidth && 
           y >= indicatorY - indicatorHeight && y <= indicatorY + 5;
  }

  public updateInventoryAnimation(): void {
    // Smooth animation for inventory expansion
    const speed = 0.15;
    const diff = this.inventoryExpansionTarget - this.inventoryExpansionCurrent;
    this.inventoryExpansionCurrent += diff * speed;
    
    // Snap to target if close enough
    if (Math.abs(diff) < 0.01) {
      this.inventoryExpansionCurrent = this.inventoryExpansionTarget;
    }
  }

  private updateHover(x: number, y: number): void {
    // Match the rendering layout exactly
    const slotWidth = 56;
    const slotHeight = 56;
    const slotsPerRow = 8;
    const slotSpacing = 4;
    const startX = (CANVAS_WIDTH - (slotsPerRow * (slotWidth + slotSpacing) - slotSpacing)) / 2;
    
    // We need maxSlots to calculate rows, but we don't have it here
    // Use a reasonable default (will be updated when rendering)
    const maxSlots = 50; // Max possible
    const numRows = Math.ceil(maxSlots / slotsPerRow);
    const totalHeight = numRows * (slotHeight + slotSpacing) - slotSpacing;
    const baseY = CANVAS_HEIGHT - totalHeight - 20;
    
    // Check if mouse is over inventory area
    if (y >= baseY - 10 && y <= baseY + totalHeight + 20) {
      const row = Math.floor((y - baseY) / (slotHeight + slotSpacing));
      const col = Math.floor((x - startX) / (slotWidth + slotSpacing));
      
      if (col >= 0 && col < slotsPerRow && row >= 0 && row < numRows) {
        const slotIndex = row * slotsPerRow + col;
        this.hoveredSlot = slotIndex;
        this.tooltipX = x;
        this.tooltipY = y - 30;
        return;
      }
    }
    this.hoveredSlot = -1;
  }

  public renderItemIcon(tileType: TileType, x: number, y: number, size: number): void {
    this.ctx.save();
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    switch (tileType) {
      case TileType.SUPER_STARS:
        // Enhanced red shoes with better detail
        // Left shoe
        this.ctx.fillStyle = '#C41E3A';
        this.ctx.fillRect(x + size * 0.1, y + size * 0.5, size * 0.25, size * 0.4);
        // Shoe highlight
        this.ctx.fillStyle = '#E63946';
        this.ctx.fillRect(x + size * 0.12, y + size * 0.52, size * 0.2, size * 0.15);
        // Sole
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + size * 0.1, y + size * 0.85, size * 0.25, size * 0.1);
        // Right shoe
        this.ctx.fillStyle = '#C41E3A';
        this.ctx.fillRect(x + size * 0.65, y + size * 0.5, size * 0.25, size * 0.4);
        // Shoe highlight
        this.ctx.fillStyle = '#E63946';
        this.ctx.fillRect(x + size * 0.67, y + size * 0.52, size * 0.2, size * 0.15);
        // Sole
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + size * 0.65, y + size * 0.85, size * 0.25, size * 0.1);
        // Gold star
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `${size * 0.35}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⭐', centerX, y + size * 0.3);
        break;

      case TileType.FEDORA:
        // Fedora hat
        this.ctx.fillStyle = '#2C2C2C';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, y + size * 0.6, size * 0.4, size * 0.12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#1C1C1C';
        this.ctx.fillRect(x + size * 0.25, y + size * 0.2, size * 0.5, size * 0.4);
        this.ctx.fillStyle = '#8B0000';
        this.ctx.fillRect(x + size * 0.25, y + size * 0.55, size * 0.5, size * 0.06);
        break;

      case TileType.SUIT_PANTS:
        // Black suit pants
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.5);
        this.ctx.fillRect(x + size * 0.25, y + size * 0.6, size * 0.2, size * 0.3);
        this.ctx.fillRect(x + size * 0.55, y + size * 0.6, size * 0.2, size * 0.3);
        break;

      case TileType.SUIT_SHIRT:
        // White dress shirt
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.5);
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.fillRect(x + size * 0.3, y + size * 0.2, size * 0.4, size * 0.15);
        this.ctx.fillStyle = '#C0C0C0';
        for (let i = 0; i < 3; i++) {
          this.ctx.fillRect(x + size * 0.48, y + size * (0.35 + i * 0.1), size * 0.04, size * 0.04);
        }
        break;

      case TileType.RAINBOW_WINGS:
        // Rainbow wings - pink/magenta gradient
        // Left wing
        this.ctx.fillStyle = '#FF1493';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size * 0.2, centerY, size * 0.25, size * 0.15, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size * 0.2, centerY - size * 0.05, size * 0.2, size * 0.1, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        // Right wing
        this.ctx.fillStyle = '#FF1493';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size * 0.8, centerY, size * 0.25, size * 0.15, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size * 0.8, centerY - size * 0.05, size * 0.2, size * 0.1, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case TileType.GOLD_LOCK:
        // Enhanced gold lock with metallic shine
        // Lock body with gradient
        const lockGradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
        lockGradient.addColorStop(0, '#FFD700');
        lockGradient.addColorStop(0.5, '#FFA500');
        lockGradient.addColorStop(1, '#FF8C00');
        this.ctx.fillStyle = lockGradient;
        this.ctx.fillRect(x + size * 0.2, y + size * 0.5, size * 0.6, size * 0.4);
        // Lock shackle (arch)
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = size * 0.1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, y + size * 0.4, size * 0.2, Math.PI, 0, false);
        this.ctx.stroke();
        // Keyhole
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + size * 0.45, y + size * 0.6, size * 0.1, size * 0.2);
        // Highlight
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + size * 0.22, y + size * 0.52, size * 0.15, size * 0.1);
        break;

      case TileType.PUNCH:
        // Enhanced fist icon with better graphics
        // Fist base (circular)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        // Fist shading
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.arc(centerX - size * 0.05, centerY - size * 0.05, size * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        // Knuckles
        this.ctx.fillStyle = '#FF8C00';
        for (let i = 0; i < 4; i++) {
          this.ctx.fillRect(centerX - size * 0.15 + i * size * 0.1, centerY - size * 0.1, size * 0.05, size * 0.08);
        }
        // Fist icon overlay
        this.ctx.font = `${size * 0.5}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('👊', centerX, centerY);
        break;

      case TileType.WRENCH:
        // Enhanced wrench with metallic look
        // Wrench body (silver)
        const wrenchGradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
        wrenchGradient.addColorStop(0, '#E8E8E8');
        wrenchGradient.addColorStop(0.5, '#C0C0C0');
        wrenchGradient.addColorStop(1, '#A0A0A0');
        this.ctx.fillStyle = wrenchGradient;
        // Handle
        this.ctx.fillRect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.2);
        // Head (circular)
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.7, centerY, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        // Highlight
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.65, centerY - size * 0.05, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        // Wrench icon overlay
        this.ctx.font = `${size * 0.4}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🔧', centerX, centerY);
        break;

      case TileType.SIGN:
        // Enhanced sign with better wood texture
        // Sign board
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + size * 0.1, y + size * 0.2, size * 0.8, size * 0.6);
        // Wood grain lines
        this.ctx.fillStyle = '#654321';
        for (let i = 0; i < 4; i++) {
          this.ctx.fillRect(x + size * 0.15, y + size * (0.25 + i * 0.15), size * 0.7, size * 0.06);
        }
        // Post
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(x + size * 0.45, y + size * 0.8, size * 0.1, size * 0.2);
        // Post highlight
        this.ctx.fillStyle = '#7A4A2A';
        this.ctx.fillRect(x + size * 0.47, y + size * 0.8, size * 0.06, size * 0.2);
        // Sign icon
        this.ctx.fillStyle = '#000';
        this.ctx.font = `${size * 0.3}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('📝', centerX, y + size * 0.5);
        break;

      case TileType.DIRT:
        // Enhanced dirt block with better texture
        // Base color
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y, size, size);
        // Darker spots for texture
        this.ctx.fillStyle = '#654321';
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            if ((i + j) % 2 === 0) {
              this.ctx.fillRect(x + size * (0.1 + i * 0.2), y + size * (0.1 + j * 0.2), size * 0.15, size * 0.15);
            }
          }
        }
        // Lighter highlights
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.1);
        this.ctx.fillRect(x + size * 0.5, y + size * 0.6, size * 0.3, size * 0.1);
        break;

      case TileType.GRASS:
        // Enhanced grass block
        // Dirt base
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x, y + size * 0.4, size, size * 0.6);
        // Grass top
        const grassGradient = this.ctx.createLinearGradient(x, y, x, y + size * 0.4);
        grassGradient.addColorStop(0, '#32CD32');
        grassGradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(x, y, size, size * 0.4);
        // Grass blades
        this.ctx.fillStyle = '#228B22';
        for (let i = 0; i < 5; i++) {
          this.ctx.fillRect(x + size * (0.1 + i * 0.2), y, size * 0.05, size * 0.3);
        }
        break;

      case TileType.STONE:
        // Enhanced stone block with better shading
        // Base color
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x, y, size, size);
        // Highlights
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.4, size * 0.3);
        // Darker areas
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(x + size * 0.5, y + size * 0.5, size * 0.4, size * 0.4);
        // Cracks/texture
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.3, y + size * 0.2);
        this.ctx.lineTo(x + size * 0.7, y + size * 0.6);
        this.ctx.stroke();
        break;

      case TileType.FLAME_SWORD:
        // Flame sword with fire effect
        // Blade (orange-red gradient)
        const swordGradient = this.ctx.createLinearGradient(x, y, x + size, y);
        swordGradient.addColorStop(0, '#FF4500'); // Orange-red
        swordGradient.addColorStop(0.5, '#FF6347'); // Tomato
        swordGradient.addColorStop(1, '#FF8C00'); // Dark orange
        this.ctx.fillStyle = swordGradient;
        // Blade shape (pointed)
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.5, y);
        this.ctx.lineTo(x + size * 0.2, y + size * 0.7);
        this.ctx.lineTo(x + size * 0.8, y + size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
        // Blade highlight
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.5, y + size * 0.1);
        this.ctx.lineTo(x + size * 0.35, y + size * 0.6);
        this.ctx.lineTo(x + size * 0.65, y + size * 0.6);
        this.ctx.closePath();
        this.ctx.fill();
        // Handle (dark)
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(x + size * 0.4, y + size * 0.7, size * 0.2, size * 0.3);
        // Flame particles
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.3, y + size * 0.2, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.7, y + size * 0.15, size * 0.06, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.5, y + size * 0.1, size * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      default:
        // Fallback: colored square
        this.ctx.fillStyle = TILE_COLORS[tileType] || '#888';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
    }

    this.ctx.restore();
  }

  public renderInventory(inventory: Item[], selectedSlot: number, maxSlots: number = INVENTORY_SLOTS, playerGems: number = 0, expansionCost: number = 0): void {
    // GROWTOPIA-STYLE INVENTORY: Fixed grid, always visible, all rows shown
    const slotWidth = 56;
    const slotHeight = 56;
    const slotsPerRow = 8; // Always 8 slots per row (like Growtopia)
    const slotSpacing = 4; // Space between slots
    const startX = (CANVAS_WIDTH - (slotsPerRow * (slotWidth + slotSpacing) - slotSpacing)) / 2;
    
    // Calculate number of rows needed
    const numRows = Math.ceil(maxSlots / slotsPerRow);
    const totalHeight = numRows * (slotHeight + slotSpacing) - slotSpacing;
    
    // Position inventory at bottom (like Growtopia)
    const baseY = CANVAS_HEIGHT - totalHeight - 20;
    
    // Background bar (semi-transparent, like Growtopia)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, baseY - 10, CANVAS_WIDTH, totalHeight + 30);
    
    // Render all slots in grid (like Growtopia - all rows always visible)
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < slotsPerRow; col++) {
        const slotIndex = row * slotsPerRow + col;
        if (slotIndex >= maxSlots) break; // Don't render beyond max slots
        
        const x = startX + col * (slotWidth + slotSpacing);
        const y = baseY + row * (slotHeight + slotSpacing);
        const item = inventory[slotIndex] || null;

        // Slot background (Growtopia style - darker gray)
        const isHovered = this.hoveredSlot === slotIndex;
        if (slotIndex === selectedSlot) {
          // Selected slot - yellow border (like Growtopia)
          this.ctx.fillStyle = '#2A2A2A'; // Dark background
          this.ctx.fillRect(x, y, slotWidth, slotHeight);
          this.ctx.strokeStyle = '#FFD700'; // Gold/yellow border
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(x - 1, y - 1, slotWidth + 2, slotHeight + 2);
        } else if (isHovered) {
          // Hovered slot - lighter background
          this.ctx.fillStyle = '#3A3A3A';
          this.ctx.fillRect(x, y, slotWidth, slotHeight);
          this.ctx.strokeStyle = '#555';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x, y, slotWidth, slotHeight);
        } else {
          // Normal slot
          this.ctx.fillStyle = '#2A2A2A';
          this.ctx.fillRect(x, y, slotWidth, slotHeight);
          this.ctx.strokeStyle = '#444';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(x, y, slotWidth, slotHeight);
        }

        // Item icon (if item exists and has count > 0)
        if (item && item.count > 0 && item.tileType !== TileType.AIR) {
          // Render item icon with padding
          this.renderItemIcon(item.tileType, x + 8, y + 8, 40);

          // Item count (bottom-right corner, like Growtopia)
          if (item.count > 1) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'bottom';
            // Background for count text
            const countText = item.count.toString();
            const textWidth = this.ctx.measureText(countText).width;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(x + slotWidth - textWidth - 6, y + slotHeight - 16, textWidth + 4, 14);
            // Count text
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(countText, x + slotWidth - 4, y + slotHeight - 4);
          }
        }
      }
    }

    // Tooltip (show item name when hovering)
    if (this.hoveredSlot >= 0 && this.hoveredSlot < inventory.length) {
      const hoveredItem = inventory[this.hoveredSlot];
      if (hoveredItem && hoveredItem.count > 0 && hoveredItem.tileType !== TileType.AIR) {
        this.renderTooltip(hoveredItem, this.tooltipX, this.tooltipY);
      }
    }
  }
  
  // Inventory expansion click check removed - now handled in shop menu

  private renderTooltip(item: Item, x: number, y: number): void {
    const padding = 8;
    const text = `${item.name} (${item.count})`;
    
    this.ctx.font = '14px monospace';
    const metrics = this.ctx.measureText(text);
    const width = metrics.width + padding * 2;
    const height = 24;

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x - width / 2, y - height, width, height);

    // Border
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - width / 2, y - height, width, height);

    // Text
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x, y - 8);
  }

  public renderSky(): void {
    // Sky gradient (light blue to sky blue) - always bright
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#E3F2FD'); // Very light blue
    gradient.addColorStop(1, '#BBDEFB'); // Soft blue
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add some clouds (simple white circles)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.drawCloud(100, 80, 40);
    this.drawCloud(300, 120, 50);
    this.drawCloud(600, 100, 45);
    this.drawCloud(800, 140, 55);
    
    // Sun
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(900, 100, 30, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawCloud(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.5, y, size * 0.7, 0, Math.PI * 2);
    this.ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public renderMenu(title: string, options: string[], selectedIndex: number): void {
    if (!this.ctx) {
      console.error('UI context is null!');
      return;
    }

    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Menu box
    const menuWidth = 400;
    const menuHeight = 300;
    const menuX = (CANVAS_WIDTH - menuWidth) / 2;
    const menuY = (CANVAS_HEIGHT - menuHeight) / 2;

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    this.ctx.strokeStyle = '#5C6BC0';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Title
    this.ctx.fillStyle = '#3F51B5';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(title, CANVAS_WIDTH / 2, menuY + 50);

    // Options
    const optionHeight = 40;
    const startY = menuY + 100;
    
    for (let i = 0; i < options.length; i++) {
      const y = startY + i * optionHeight;
      
      if (i === selectedIndex) {
        this.ctx.fillStyle = '#E8EAF6';
        this.ctx.fillRect(menuX + 20, y - 5, menuWidth - 40, optionHeight - 10);
        this.ctx.strokeStyle = '#5C6BC0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(menuX + 20, y - 5, menuWidth - 40, optionHeight - 10);
      }
      
      this.ctx.fillStyle = i === selectedIndex ? '#3F51B5' : '#424242';
      this.ctx.font = '20px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(options[i], CANVAS_WIDTH / 2, y + optionHeight / 2);
    }
  }

  public renderHUD(): void {
    // Simple HUD - no day/night indicator
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    // Can add other HUD elements here if needed
  }
}

