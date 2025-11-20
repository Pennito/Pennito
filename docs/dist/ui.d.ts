import { Item } from './utils/types.js';
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
    updateInventoryAnimation(): void;
    private updateHover;
    private renderItemIcon;
    renderInventory(inventory: Item[], selectedSlot: number, maxSlots?: number, playerGems?: number, expansionCost?: number): void;
    private renderTooltip;
    renderSky(): void;
    private drawCloud;
    renderMenu(title: string, options: string[], selectedIndex: number): void;
    renderHUD(): void;
}
//# sourceMappingURL=ui.d.ts.map