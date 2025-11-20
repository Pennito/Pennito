import { TileType } from '../utils/types.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants.js';

export type ShopCategory = 'clothes' | 'blocks' | 'essentials';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  tileType: TileType;
  category: ShopCategory;
  isEquipment: boolean; // If true, cannot be placed, only equipped
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'super_stars',
    name: 'Super Stars',
    description: 'Red shoes - 1.5x speed boost',
    price: 500,
    tileType: TileType.SUPER_STARS,
    category: 'clothes',
    isEquipment: true
  },
  {
    id: 'fedora',
    name: 'Fedora',
    description: 'Stylish black fedora hat',
    price: 1000,
    tileType: TileType.FEDORA,
    category: 'clothes',
    isEquipment: true
  },
  {
    id: 'suit_pants',
    name: 'Suit Pants',
    description: 'Elegant black suit pants',
    price: 800,
    tileType: TileType.SUIT_PANTS,
    category: 'clothes',
    isEquipment: true
  },
  {
    id: 'suit_shirt',
    name: 'Suit Shirt',
    description: 'Crisp white dress shirt',
    price: 600,
    tileType: TileType.SUIT_SHIRT,
    category: 'clothes',
    isEquipment: true
  },
  {
    id: 'rainbow_wings',
    name: 'Rainbow Wings',
    description: 'Enables double jump ability',
    price: 5000,
    tileType: TileType.RAINBOW_WINGS,
    category: 'clothes',
    isEquipment: true
  },
  {
    id: 'sign',
    name: 'Sign',
    description: 'Background block - write custom text',
    price: 25,
    tileType: TileType.SIGN,
    category: 'blocks',
    isEquipment: false
  },
  {
    id: 'gold_lock',
    name: 'Gold Lock',
    description: 'Protect your world from others',
    price: 100,
    tileType: TileType.GOLD_LOCK,
    category: 'essentials',
    isEquipment: false
  }
];

export class ShopUI {
  private activeTab: ShopCategory = 'essentials';
  private scrollY: number = 0;
  private maxScrollY: number = 0;

  constructor() {}

  public getActiveTab(): ShopCategory {
    return this.activeTab;
  }

  public setActiveTab(tab: ShopCategory): void {
    this.activeTab = tab;
    this.scrollY = 0; // Reset scroll when switching tabs
  }

  public scroll(delta: number): void {
    this.scrollY = Math.max(0, Math.min(this.scrollY + delta, this.maxScrollY));
  }

  public render(
    ctx: CanvasRenderingContext2D,
    mouseX: number,
    mouseY: number,
    gems: number,
    redeemCodeInput: string,
    maxInventorySlots: number = 8,
    inventoryExpansionCost: number = 50
  ): void {
    const modalX = CANVAS_WIDTH / 2 - 400;
    const modalY = 50;
    const modalW = 800;
    const modalH = CANVAS_HEIGHT - 100;

    // Overlay background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Modal background
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(modalX, modalY, modalW, modalH);
    ctx.strokeStyle = '#5C6BC0';
    ctx.lineWidth = 4;
    ctx.strokeRect(modalX, modalY, modalW, modalH);

    // Title
    ctx.fillStyle = '#3F51B5';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🛒 SHOP', CANVAS_WIDTH / 2, modalY + 45);

    // Gems display
    ctx.fillStyle = '#424242';
    ctx.font = '18px monospace';
    const gemsText = gems >= 1000000000 ? '1,000,000,000 (MAX)' : gems.toLocaleString();
    ctx.fillText(`💎 Gems: ${gemsText}`, CANVAS_WIDTH / 2, modalY + 75);

    // === TABS ===
    const tabY = modalY + 95;
    const tabHeight = 50;
    const tabWidth = (modalW - 60) / 3;

    const tabs: Array<{ id: ShopCategory; label: string; icon: string }> = [
      { id: 'clothes', label: 'CLOTHES', icon: '👕' },
      { id: 'blocks', label: 'BLOCKS', icon: '🧱' },
      { id: 'essentials', label: 'ESSENTIALS', icon: '⚡' }
    ];

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabX = modalX + 20 + (i * tabWidth);
      const isActive = this.activeTab === tab.id;
      const isHovering = mouseX >= tabX && mouseX <= tabX + tabWidth && mouseY >= tabY && mouseY <= tabY + tabHeight;

      // Tab background
      if (isActive) {
        ctx.fillStyle = '#5C6BC0'; // Active tab
      } else if (isHovering) {
        ctx.fillStyle = '#9FA8DA'; // Hover tab
      } else {
        ctx.fillStyle = '#E8EAF6'; // Inactive tab
      }

      ctx.fillRect(tabX, tabY, tabWidth, tabHeight);
      ctx.strokeStyle = '#5C6BC0';
      ctx.lineWidth = 2;
      ctx.strokeRect(tabX, tabY, tabWidth, tabHeight);

      // Tab text
      ctx.fillStyle = isActive ? '#FFFFFF' : '#3F51B5';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${tab.icon} ${tab.label}`, tabX + tabWidth / 2, tabY + 32);
    }

    // === CONTENT AREA (with scrolling) ===
    const contentY = tabY + tabHeight + 10;
    const contentH = modalH - (contentY - modalY) - 120; // Leave space for redeem + close

    // Filter items by active tab
    const filteredItems = SHOP_ITEMS.filter(item => item.category === this.activeTab);

    // Calculate max scroll
    const itemHeight = 90;
    const totalContentHeight = filteredItems.length * itemHeight;
    this.maxScrollY = Math.max(0, totalContentHeight - contentH + 20);

    // Clipping for scrollable content
    ctx.save();
    ctx.beginPath();
    ctx.rect(modalX + 20, contentY, modalW - 40, contentH);
    ctx.clip();

    let itemY = contentY - this.scrollY;

    for (const item of filteredItems) {
      // Skip if out of visible bounds
      if (itemY + itemHeight < contentY || itemY > contentY + contentH) {
        itemY += itemHeight;
        continue;
      }

      // Item card
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(modalX + 30, itemY, modalW - 60, 80);
      ctx.strokeStyle = '#5C6BC0';
      ctx.lineWidth = 2;
      ctx.strokeRect(modalX + 30, itemY, modalW - 60, 80);

      // Item icon (using improved rendering)
      this.renderItemIcon(ctx, item.tileType, modalX + 45, itemY + 15, 50);

      // Item details
      ctx.fillStyle = '#212121';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, modalX + 110, itemY + 28);

      // Equipment badge (moved to right side to avoid overlap with name)
      if (item.isEquipment) {
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('EQUIPMENT', modalX + modalW - 50, itemY + 28);
        ctx.textAlign = 'left';
      }

      ctx.font = '14px monospace';
      ctx.fillStyle = '#616161';
      ctx.fillText(item.description, modalX + 110, itemY + 50);

      ctx.fillStyle = '#5C6BC0';
      ctx.fillText(`Price: ${item.price} gems`, modalX + 110, itemY + 68);

      // Buy button
      const buyBtnX = modalX + modalW - 140;
      const buyBtnY = itemY + 20;
      const canAfford = gems >= item.price;
      const isHoveringBuy = mouseX >= buyBtnX && mouseX <= buyBtnX + 100 && mouseY >= buyBtnY && mouseY <= buyBtnY + 40;

      ctx.fillStyle = canAfford ? (isHoveringBuy ? '#7986CB' : '#5C6BC0') : '#BDBDBD';
      ctx.fillRect(buyBtnX, buyBtnY, 100, 40);
      ctx.strokeStyle = '#3F51B5';
      ctx.lineWidth = 2;
      ctx.strokeRect(buyBtnX, buyBtnY, 100, 40);

      ctx.fillStyle = '#FFF';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BUY', buyBtnX + 50, buyBtnY + 26);

      itemY += itemHeight;
    }

    // Add Inventory Expansion as special item in Essentials tab
    if (this.activeTab === 'essentials' && maxInventorySlots < 50) {
      const expansionY = itemY;
      
      // Skip if out of bounds
      if (expansionY + itemHeight >= contentY && expansionY <= contentY + contentH) {
        // Item card
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(modalX + 30, expansionY, modalW - 60, 80);
        ctx.strokeStyle = '#5C6BC0';
        ctx.lineWidth = 2;
        ctx.strokeRect(modalX + 30, expansionY, modalW - 60, 80);

        // Icon (backpack/bag icon)
        ctx.fillStyle = '#4CAF50';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🎒', modalX + 70, expansionY + 50);

        // Item details
        ctx.fillStyle = '#212121';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Inventory Expansion', modalX + 110, expansionY + 28);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#616161';
        ctx.fillText(`Add 2 more inventory slots (Current: ${maxInventorySlots}/50)`, modalX + 110, expansionY + 50);

        ctx.fillStyle = '#5C6BC0';
        ctx.fillText(`Price: ${inventoryExpansionCost} gems`, modalX + 110, expansionY + 68);

        // Buy button
        const buyBtnX = modalX + modalW - 140;
        const buyBtnY = expansionY + 20;
        const canAfford = gems >= inventoryExpansionCost;
        const isHoveringBuy = mouseX >= buyBtnX && mouseX <= buyBtnX + 100 && mouseY >= buyBtnY && mouseY <= buyBtnY + 40;

        ctx.fillStyle = canAfford ? (isHoveringBuy ? '#7986CB' : '#5C6BC0') : '#BDBDBD';
        ctx.fillRect(buyBtnX, buyBtnY, 100, 40);
        ctx.strokeStyle = '#3F51B5';
        ctx.lineWidth = 2;
        ctx.strokeRect(buyBtnX, buyBtnY, 100, 40);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BUY', buyBtnX + 50, buyBtnY + 25);
      }
    }

    ctx.restore();

    // Scroll indicators
    if (this.scrollY > 0) {
      ctx.fillStyle = '#5C6BC0';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▲', CANVAS_WIDTH / 2, contentY + 20);
    }

    if (this.scrollY < this.maxScrollY) {
      ctx.fillStyle = '#5C6BC0';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▼', CANVAS_WIDTH / 2, contentY + contentH - 20);
    }

    // === REDEEM CODES SECTION ===
    const redeemY = contentY + contentH + 10;

    ctx.fillStyle = '#F3E5F5';
    ctx.fillRect(modalX + 20, redeemY, modalW - 40, 30);
    ctx.strokeStyle = '#AB47BC';
    ctx.lineWidth = 2;
    ctx.strokeRect(modalX + 20, redeemY, modalW - 40, 30);
    ctx.fillStyle = '#6A1B9A';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🎁 REDEEM CODE', modalX + 30, redeemY + 21);

    // Code input box
    const inputX = modalX + 30;
    const inputY = redeemY + 35;
    const inputW = modalW - 170;
    const inputH = 35;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(inputX, inputY, inputW, inputH);
    ctx.strokeStyle = '#AB47BC';
    ctx.lineWidth = 2;
    ctx.strokeRect(inputX, inputY, inputW, inputH);

    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    const displayText = redeemCodeInput || 'Enter code...';
    ctx.fillStyle = redeemCodeInput ? '#212121' : '#9E9E9E';
    ctx.fillText(displayText, inputX + 10, inputY + 23);

    // Redeem button
    const redeemBtnX = inputX + inputW + 10;
    const redeemBtnY = inputY;
    const isHoveringRedeem = mouseX >= redeemBtnX && mouseX <= redeemBtnX + 110 && mouseY >= redeemBtnY && mouseY <= redeemBtnY + inputH;

    ctx.fillStyle = isHoveringRedeem ? '#BA68C8' : '#AB47BC';
    ctx.fillRect(redeemBtnX, redeemBtnY, 110, inputH);
    ctx.strokeStyle = '#6A1B9A';
    ctx.lineWidth = 2;
    ctx.strokeRect(redeemBtnX, redeemBtnY, 110, inputH);
    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('REDEEM', redeemBtnX + 55, redeemBtnY + 22);

    // Close button
    const closeBtnX = modalX + modalW / 2 - 75;
    const closeBtnY = modalY + modalH - 50;
    const isHoveringClose = mouseX >= closeBtnX && mouseX <= closeBtnX + 150 && mouseY >= closeBtnY && mouseY <= closeBtnY + 40;

    ctx.fillStyle = isHoveringClose ? '#E57373' : '#EF5350';
    ctx.fillRect(closeBtnX, closeBtnY, 150, 40);
    ctx.strokeStyle = '#C62828';
    ctx.lineWidth = 2;
    ctx.strokeRect(closeBtnX, closeBtnY, 150, 40);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLOSE SHOP', closeBtnX + 75, closeBtnY + 26);
  }

  private renderItemIcon(
    ctx: CanvasRenderingContext2D,
    tileType: TileType,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.save();

    switch (tileType) {
      case TileType.SUPER_STARS:
        // Red shoes with golden star
        ctx.fillStyle = '#C41E3A'; // Deep red
        ctx.fillRect(x, y + size * 0.4, size * 0.4, size * 0.6); // Left shoe
        ctx.fillRect(x + size * 0.6, y + size * 0.4, size * 0.4, size * 0.6); // Right shoe

        // Shoe shadow
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(x, y + size * 0.8, size * 0.4, size * 0.2);
        ctx.fillRect(x + size * 0.6, y + size * 0.8, size * 0.4, size * 0.2);

        // White soles
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + size * 0.05, y + size * 0.9, size * 0.3, size * 0.1);
        ctx.fillRect(x + size * 0.65, y + size * 0.9, size * 0.3, size * 0.1);

        // Gold star
        ctx.fillStyle = '#FFD700';
        ctx.font = `${size * 0.5}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', x + size / 2, y + size * 0.3);
        break;

      case TileType.FEDORA:
        // Black fedora hat
        // Hat brim (wider oval)
        ctx.fillStyle = '#2C2C2C'; // Dark gray/black
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size * 0.6, size * 0.45, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat crown (taller part)
        ctx.fillStyle = '#1C1C1C'; // Slightly darker
        ctx.fillRect(x + size * 0.25, y + size * 0.2, size * 0.5, size * 0.4);
        
        // Hat top (rounded)
        ctx.fillStyle = '#2C2C2C';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size * 0.2, size * 0.25, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat band (red stripe)
        ctx.fillStyle = '#8B0000'; // Dark red
        ctx.fillRect(x + size * 0.25, y + size * 0.55, size * 0.5, size * 0.08);
        break;

      case TileType.SUIT_PANTS:
        // Black suit pants
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.5);
        // Legs
        ctx.fillRect(x + size * 0.25, y + size * 0.6, size * 0.2, size * 0.3);
        ctx.fillRect(x + size * 0.55, y + size * 0.6, size * 0.2, size * 0.3);
        break;

      case TileType.SUIT_SHIRT:
        // White dress shirt
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.5);
        // Collar
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x + size * 0.3, y + size * 0.2, size * 0.4, size * 0.15);
        // Buttons
        ctx.fillStyle = '#C0C0C0';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x + size * 0.48, y + size * (0.35 + i * 0.1), size * 0.04, size * 0.04);
        }
        break;

      case TileType.RAINBOW_WINGS:
        // Rainbow wings - pink/magenta gradient
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        // Left wing
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.2, centerY, size * 0.25, size * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.2, centerY - size * 0.05, size * 0.2, size * 0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Right wing
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.8, centerY, size * 0.25, size * 0.15, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.8, centerY - size * 0.05, size * 0.2, size * 0.1, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case TileType.SIGN:
        // Wooden sign
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + size * 0.1, y + size * 0.2, size * 0.8, size * 0.6);

        // Wood grain
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + size * 0.15, y + size * 0.25, size * 0.7, size * 0.1);
        ctx.fillRect(x + size * 0.15, y + size * 0.45, size * 0.7, size * 0.1);
        ctx.fillRect(x + size * 0.15, y + size * 0.65, size * 0.7, size * 0.1);

        // Post
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + size * 0.45, y + size * 0.8, size * 0.1, size * 0.2);

        // Pencil icon
        ctx.fillStyle = '#000000';
        ctx.font = `${size * 0.4}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📝', x + size / 2, y + size * 0.5);
        break;

      case TileType.GOLD_LOCK:
        // Gold lock body
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + size * 0.2, y + size * 0.5, size * 0.6, size * 0.4);

        // Shading
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(x + size * 0.2, y + size * 0.7, size * 0.6, size * 0.2);

        // Shackle
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = size * 0.1;
        ctx.beginPath();
        ctx.arc(x + size * 0.5, y + size * 0.4, size * 0.2, Math.PI, 0, false);
        ctx.stroke();

        // Keyhole
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + size * 0.45, y + size * 0.6, size * 0.1, size * 0.2);
        ctx.beginPath();
        ctx.arc(x + size * 0.5, y + size * 0.65, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        // Fallback: colored square
        ctx.fillStyle = '#888888';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
    }

    ctx.restore();
  }

  // Check if a click hit a tab
  public checkTabClick(mouseX: number, mouseY: number): ShopCategory | null {
    const modalX = CANVAS_WIDTH / 2 - 400;
    const modalY = 50;
    const modalW = 800;
    const tabY = modalY + 95;
    const tabHeight = 50;
    const tabWidth = (modalW - 60) / 3;

    if (mouseY < tabY || mouseY > tabY + tabHeight) return null;

    const tabs: ShopCategory[] = ['clothes', 'blocks', 'essentials'];
    for (let i = 0; i < tabs.length; i++) {
      const tabX = modalX + 20 + (i * tabWidth);
      if (mouseX >= tabX && mouseX <= tabX + tabWidth) {
        return tabs[i];
      }
    }

    return null;
  }

  // Check if a click hit a buy button
  public checkBuyClick(
    mouseX: number, 
    mouseY: number, 
    maxInventorySlots: number = 8,
    inventoryExpansionCost: number = 50
  ): ShopItem | 'inventory_expansion' | null {
    const modalX = CANVAS_WIDTH / 2 - 400;
    const modalY = 50;
    const modalW = 800;
    const tabY = modalY + 95;
    const tabHeight = 50;
    const contentY = tabY + tabHeight + 10;
    const contentH = CANVAS_HEIGHT - 100 - (contentY - modalY) - 120;

    const filteredItems = SHOP_ITEMS.filter(item => item.category === this.activeTab);
    const itemHeight = 90;

    let itemY = contentY - this.scrollY;

    for (const item of filteredItems) {
      if (itemY + itemHeight < contentY || itemY > contentY + contentH) {
        itemY += itemHeight;
        continue;
      }

      const buyBtnX = modalX + modalW - 140;
      const buyBtnY = itemY + 20;

      if (mouseX >= buyBtnX && mouseX <= buyBtnX + 100 && mouseY >= buyBtnY && mouseY <= buyBtnY + 40) {
        return item;
      }

      itemY += itemHeight;
    }

    // Check inventory expansion button (in essentials tab)
    if (this.activeTab === 'essentials' && maxInventorySlots < 50) {
      const expansionY = itemY;
      if (expansionY + itemHeight >= contentY && expansionY <= contentY + contentH) {
        const buyBtnX = modalX + modalW - 140;
        const buyBtnY = expansionY + 20;
        if (mouseX >= buyBtnX && mouseX <= buyBtnX + 100 && mouseY >= buyBtnY && mouseY <= buyBtnY + 40) {
          return 'inventory_expansion';
        }
      }
    }

    return null;
  }

  // Check if click is on close button
  public checkCloseClick(mouseX: number, mouseY: number): boolean {
    const modalX = CANVAS_WIDTH / 2 - 400;
    const modalY = 50;
    const modalW = 800;
    const modalH = CANVAS_HEIGHT - 100;
    const closeBtnX = modalX + modalW / 2 - 75;
    const closeBtnY = modalY + modalH - 50;

    return mouseX >= closeBtnX && mouseX <= closeBtnX + 150 && mouseY >= closeBtnY && mouseY <= closeBtnY + 40;
  }

  // Check if click is on redeem button
  public checkRedeemClick(mouseX: number, mouseY: number): boolean {
    const modalX = CANVAS_WIDTH / 2 - 400;
    const modalY = 50;
    const modalW = 800;
    const modalH = CANVAS_HEIGHT - 100;
    const tabY = modalY + 95;
    const tabHeight = 50;
    const contentY = tabY + tabHeight + 10;
    const contentH = modalH - (contentY - modalY) - 120;
    const redeemY = contentY + contentH + 10;
    const inputX = modalX + 30;
    const inputY = redeemY + 35;
    const inputW = modalW - 170;
    const inputH = 35;
    const redeemBtnX = inputX + inputW + 10;
    const redeemBtnY = inputY;

    return mouseX >= redeemBtnX && mouseX <= redeemBtnX + 110 && mouseY >= redeemBtnY && mouseY <= redeemBtnY + inputH;
  }
}

