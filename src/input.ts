export class InputManager {
  private keys: Set<string> = new Set();
  private mouseButtons: Set<number> = new Set();
  public mouseX: number = 0;
  public mouseY: number = 0;
  public mouseWorldX: number = 0;
  public mouseWorldY: number = 0;

  private keyPresses: Set<string> = new Set(); // Track key presses (not held)
  private lastJumpPress: number = 0;
  private spacePressed: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
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
    return this.keys.has(key.toLowerCase());
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

