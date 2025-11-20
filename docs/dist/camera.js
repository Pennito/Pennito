import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants.js';
export class Camera {
    constructor() {
        this.followSpeed = 0.1;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }
    follow(targetX, targetY, targetWidth, targetHeight) {
        // Center camera on target
        this.targetX = targetX - CANVAS_WIDTH / 2 + targetWidth / 2;
        this.targetY = targetY - CANVAS_HEIGHT / 2 + targetHeight / 2;
        // Smooth camera movement
        this.x += (this.targetX - this.x) * this.followSpeed;
        this.y += (this.targetY - this.y) * this.followSpeed;
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    }
}
//# sourceMappingURL=camera.js.map