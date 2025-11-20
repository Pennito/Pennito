import { TileType } from '../utils/types';
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    tileType: TileType;
    category: 'clothes' | 'blocks' | 'essentials';
    isEquipment: boolean;
}
export declare const SHOP_ITEMS: ShopItem[];
export declare function renderItemIcon(ctx: CanvasRenderingContext2D, tileType: TileType, x: number, y: number, size: number): void;
//# sourceMappingURL=shop_helper.d.ts.map