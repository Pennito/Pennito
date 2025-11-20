import { TileType } from '../utils/types.js';
import { TILE_SIZE } from '../utils/constants.js';
export class DroppedItem {
    constructor(x, y, tileType, gemValue = 1) {
        this.pickupDelay = 500; // Delay before item can be picked up (ms)
        this.gemValue = 1; // For GEM items, how many gems this represents (1-5)
        this.previouslyColliding = false; // remember if player is/was overlapping
        this.x = x;
        this.y = y;
        this.tileType = tileType;
        this.gemValue = gemValue;
        this.spawnTime = Date.now();
    }
    canPickup() {
        return Date.now() - this.spawnTime >= this.pickupDelay;
    }
    render(ctx, cameraX, cameraY, ui) {
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
        }
        else {
            // Use UI's renderItemIcon for better graphics (if available)
            if (ui) {
                const iconSize = 32; // Larger icon for dropped items
                const iconX = screenX + (TILE_SIZE - iconSize) / 2;
                const iconY = screenY + (TILE_SIZE - iconSize) / 2;
                ui.renderItemIcon(this.tileType, iconX, iconY, iconSize);
                // Add a subtle glow/shadow effect for dropped items
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.shadowColor = 'transparent'; // Reset
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            else {
                // Fallback: simple colored block
                const size = 24;
                const offset = (TILE_SIZE - size) / 2;
                ctx.fillStyle = '#8B4513'; // Default brown
                ctx.fillRect(screenX + offset, screenY + offset, size, size);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX + offset, screenY + offset, size, size);
            }
        }
    }
    checkCollision(playerX, playerY, playerWidth, playerHeight) {
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
    shouldPickup(playerX, playerY, playerW, playerH) {
        if (!this.canPickup())
            return false;
        const colliding = this.checkCollision(playerX, playerY, playerW, playerH);
        // Only allow pickup if player was NOT colliding in a previous frame (i.e., stepped off then back on)
        const pick = colliding && !this.previouslyColliding;
        this.previouslyColliding = colliding; // update state for next frame
        return pick;
    }
}
//# sourceMappingURL=droppedItem.js.map