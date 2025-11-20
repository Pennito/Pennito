// Shop helper functions for rendering items with better graphics
import { TileType } from '../utils/types';
export const SHOP_ITEMS = [
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
// Render item icon with better pixel art graphics
export function renderItemIcon(ctx, tileType, x, y, size) {
    ctx.save();
    switch (tileType) {
        case TileType.SUPER_STARS:
            // Red shoes with star
            ctx.fillStyle = '#C41E3A'; // Deep red
            ctx.fillRect(x, y + size * 0.4, size * 0.4, size * 0.6); // Left shoe
            ctx.fillRect(x + size * 0.6, y + size * 0.4, size * 0.4, size * 0.6); // Right shoe
            // Shoe details
            ctx.fillStyle = '#8B0000'; // Dark red shadow
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
        case TileType.SIGN:
            // Wooden sign
            ctx.fillStyle = '#8B4513'; // Saddle brown
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
            ctx.fillStyle = '#DAA520'; // Goldenrod
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
        case TileType.DIRT:
            // Brown dirt with texture
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y, size, size);
            // Dirt particles
            ctx.fillStyle = '#654321';
            for (let i = 0; i < 8; i++) {
                const px = x + (Math.random() * size);
                const py = y + (Math.random() * size);
                ctx.fillRect(px, py, size * 0.15, size * 0.15);
            }
            // Border
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, size, size);
            break;
        case TileType.PUNCH:
            // Fist icon
            ctx.fillStyle = '#FFD4A3'; // Skin tone
            ctx.fillRect(x + size * 0.3, y + size * 0.4, size * 0.4, size * 0.5);
            // Fingers
            ctx.fillRect(x + size * 0.15, y + size * 0.3, size * 0.15, size * 0.3);
            ctx.fillRect(x + size * 0.3, y + size * 0.25, size * 0.15, size * 0.35);
            ctx.fillRect(x + size * 0.45, y + size * 0.25, size * 0.15, size * 0.35);
            ctx.fillRect(x + size * 0.6, y + size * 0.3, size * 0.15, size * 0.3);
            // Wrist
            ctx.fillStyle = '#F0C090';
            ctx.fillRect(x + size * 0.35, y + size * 0.8, size * 0.3, size * 0.2);
            // Impact lines
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + size * 0.1, y + size * 0.2);
            ctx.lineTo(x, y + size * 0.1);
            ctx.moveTo(x + size * 0.2, y + size * 0.1);
            ctx.lineTo(x + size * 0.15, y);
            ctx.stroke();
            break;
        case TileType.WRENCH:
            // Silver wrench
            ctx.fillStyle = '#C0C0C0';
            // Handle
            ctx.fillRect(x + size * 0.2, y + size * 0.6, size * 0.15, size * 0.35);
            // Adjustable head
            ctx.fillRect(x + size * 0.15, y + size * 0.2, size * 0.35, size * 0.45);
            // Jaw
            ctx.fillRect(x + size * 0.45, y + size * 0.25, size * 0.2, size * 0.15);
            // Shading
            ctx.fillStyle = '#A9A9A9'; // Dark gray
            ctx.fillRect(x + size * 0.2, y + size * 0.8, size * 0.15, size * 0.15);
            ctx.fillRect(x + size * 0.15, y + size * 0.5, size * 0.35, size * 0.1);
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
//# sourceMappingURL=shop_helper.js.map