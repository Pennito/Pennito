import { MobileControls } from './utils/mobile.js';

export class InputManager {
  private keys: Set<string> = new Set();
  private mouseButtons: Set<number> = new Set();
  private touchButtons: Set<number> = new Set(); // Track touch buttons
  public mouseX: number = 0;
  public mouseY: number = 0;
  public mouseWorldX: number = 0;
  public mouseWorldY: number = 0;
  public mobileControls: MobileControls | null = null;

  private keyPresses: Set<string> = new Set(); // Track key presses (not held)
  private lastJumpPress: number = 0;
  private spacePressed: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize mobile controls if on mobile
    this.mobileControls = new MobileControls(canvas);
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      // Also handle arrow keys
      if (e.key === 'ArrowLeft') this.keys.add('arrowleft');
      if (e.key === 'ArrowRight') this.keys.add('arrowright');
      if (e.key === 'ArrowUp') this.keys.add('arrowup');
      if (e.key === 'ArrowDown') this.keys.add('arrowdown');
      if (e.key === ' ') {
        e.preventDefault();
        this.keys.add(' ');
        // Track space press for jump (only trigger once per press)
        const now = Date.now();
        if (!this.spacePressed && now - this.lastJumpPress > 150) { // Debounce jump - 150ms
          this.keyPresses.add(' ');
          this.lastJumpPress = now;
          this.spacePressed = true;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys.delete(key);
      // Also handle arrow keys
      if (e.key === 'ArrowLeft') this.keys.delete('arrowleft');
      if (e.key === 'ArrowRight') this.keys.delete('arrowright');
      if (e.key === 'ArrowUp') this.keys.delete('arrowup');
      if (e.key === 'ArrowDown') this.keys.delete('arrowdown');
      if (e.key === ' ') {
        this.keys.delete(' ');
        this.spacePressed = false; // Reset space pressed flag
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button);
      this.updateMousePosition(e, canvas);
    });

    canvas.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button);
    });

    canvas.addEventListener('mousemove', (e) => {
      this.updateMousePosition(e, canvas);
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
      // Left click (0) for touch
      this.touchButtons.add(0);
      this.mouseButtons.add(0);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchButtons.delete(0);
      this.mouseButtons.delete(0);
    }, { passive: false });

    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.touchButtons.delete(0);
      this.mouseButtons.delete(0);
    }, { passive: false });
  }

  private updateMousePosition(e: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  public updateMouseWorld(cameraX: number, cameraY: number): void {
    this.mouseWorldX = this.mouseX + cameraX;
    this.mouseWorldY = this.mouseY + cameraY;
  }

  public isKeyPressed(key: string): boolean {
    const keyLower = key.toLowerCase();
    
    // Check mobile controls for movement
    if (this.mobileControls) {
      if (keyLower === 'a' || keyLower === 'arrowleft') {
        return this.keys.has(keyLower) || this.mobileControls.isLeftHeld();
      }
      if (keyLower === 'd' || keyLower === 'arrowright') {
        return this.keys.has(keyLower) || this.mobileControls.isRightHeld();
      }
      if (keyLower === ' ' || keyLower === 'w' || keyLower === 'arrowup') {
        return this.keys.has(keyLower) || this.mobileControls.isJumpHeld();
      }
    }
    
    return this.keys.has(keyLower);
  }

  public wasKeyJustPressed(key: string): boolean {
    const pressed = this.keyPresses.has(key.toLowerCase());
    if (pressed) {
      this.keyPresses.delete(key.toLowerCase()); // Consume the press
    }
    return pressed;
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  public getMouseTile(tileSize: number): { x: number; y: number } {
    return {
      x: Math.floor(this.mouseWorldX / tileSize),
      y: Math.floor(this.mouseWorldY / tileSize)
    };
  }
}

