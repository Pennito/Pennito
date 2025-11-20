import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants.js';

export class Camera {
  public x: number;
  public y: number;
  private targetX: number;
  private targetY: number;
  private followSpeed: number = 0.1;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  public follow(targetX: number, targetY: number, targetWidth: number, targetHeight: number): void {
    // Center camera on target
    this.targetX = targetX - CANVAS_WIDTH / 2 + targetWidth / 2;
    this.targetY = targetY - CANVAS_HEIGHT / 2 + targetHeight / 2;
    
    // Smooth camera movement
    this.x += (this.targetX - this.x) * this.followSpeed;
    this.y += (this.targetY - this.y) * this.followSpeed;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }
}

