import { Item, TileType } from './utils/types.js';
export declare class UI {
    private canvas;
    private ctx;
    private hoveredSlot;
    private tooltipItem;
    private tooltipX;
    private tooltipY;
    private inventoryExpanded;
    private inventoryExpansionTarget;
    private inventoryExpansionCurrent;
    constructor(canvas: HTMLCanvasElement);
    isInventoryExpanded(): boolean;
    toggleInventoryExpansion(): void;
    checkExpandButtonClick(x: number, y: number, maxSlots: number): boolean;
    updateInventoryAnimation(): void;
    private updateHover;
    renderItemIcon(tileType: TileType, x: number, y: number, size: number): void;
    renderInventory(inventory: Item[], selectedSlot: number, maxSlots?: number, playerGems?: number, expansionCost?: number): void;
    private renderTooltip;
    renderSky(): void;
    private drawCloud;
    renderMenu(title: string, options: string[], selectedIndex: number): void;
    renderHUD(): void;
}
//# sourceMappingURL=ui.d.ts.map