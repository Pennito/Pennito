import { TileType } from '../utils/types.js';
export type ShopCategory = 'clothes' | 'blocks' | 'essentials';
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    tileType: TileType;
    category: ShopCategory;
    isEquipment: boolean;
}
export declare const SHOP_ITEMS: ShopItem[];
export declare class ShopUI {
    private activeTab;
    private scrollY;
    private maxScrollY;
    constructor();
    getActiveTab(): ShopCategory;
    setActiveTab(tab: ShopCategory): void;
    scroll(delta: number): void;
    render(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number, gems: number, redeemCodeInput: string, maxInventorySlots?: number, inventoryExpansionCost?: number): void;
    private renderItemIcon;
    checkTabClick(mouseX: number, mouseY: number): ShopCategory | null;
    checkBuyClick(mouseX: number, mouseY: number, maxInventorySlots?: number, inventoryExpansionCost?: number): ShopItem | 'inventory_expansion' | null;
    checkCloseClick(mouseX: number, mouseY: number): boolean;
    checkRedeemClick(mouseX: number, mouseY: number): boolean;
}
//# sourceMappingURL=shopUI.d.ts.map