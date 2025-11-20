import { DatabaseSync } from '../network/sync.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants.js';

export type WorldSelectResult = {
  worldName: string;
  isNew: boolean;
};

export class WorldSelectScreen {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private worldName: string = '';
  private errorMessage: string = '';
  private recentWorlds: string[] = [];
  private onWorldSelected: (worldName: string, isNew: boolean) => void;
  private dbSync: DatabaseSync;
  private username: string;

  constructor(
    canvas: HTMLCanvasElement,
    username: string,
    onWorldSelected: (worldName: string, isNew: boolean) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.username = username;
    this.onWorldSelected = onWorldSelected;
    this.dbSync = DatabaseSync.getInstance();

    this.loadRecentWorlds();
    this.setupInput();
  }

  private async loadRecentWorlds(): Promise<void> {
    // Load recent worlds from database
    const allWorlds = await this.dbSync.getRecentWorlds(10);
    
    // Randomly select 2 worlds from the list
    if (allWorlds.length > 0) {
      const shuffled = [...allWorlds].sort(() => Math.random() - 0.5);
      this.recentWorlds = shuffled.slice(0, 2);
    } else {
      this.recentWorlds = [];
    }
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.submit();
      return;
    }

    if (e.key === 'Backspace') {
      this.worldName = this.worldName.slice(0, -1);
      this.errorMessage = ''; // Clear error when typing
      return;
    }

    // Only allow letters and numbers (no spaces, underscores, hyphens, or special characters)
    // Check if key is a single character and is alphanumeric
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Only allow a-z, A-Z, 0-9 (max 8 characters)
      const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key);
      if (isAlphanumeric && this.worldName.length < 8) {
        this.worldName += e.key;
        this.errorMessage = ''; // Clear error when typing valid characters
      }
    }
  }

  private async submit(): Promise<void> {
    this.errorMessage = '';

    // Remove any invalid characters that might have been entered
    const cleanedName = this.worldName.replace(/[^a-zA-Z0-9]/g, '');
    
    if (!cleanedName) {
      this.errorMessage = 'World name is required';
      return;
    }

    if (cleanedName.length < 1) {
      this.errorMessage = 'World name is required';
      return;
    }
    
    if (cleanedName.length > 8) {
      this.errorMessage = 'World name must be 1-8 characters';
      return;
    }

    // Validate that world name contains only letters and numbers (strict check)
    if (!/^[a-zA-Z0-9]+$/.test(cleanedName)) {
      this.errorMessage = 'World name can only contain letters and numbers (no spaces or special characters)';
      return;
    }

    // Update worldName to cleaned version
    this.worldName = cleanedName;

    const dbSync = DatabaseSync.getInstance();
    const world = await dbSync.loadWorld(cleanedName);
    const exists = world !== null;
    this.onWorldSelected(cleanedName, !exists);
  }

  public handleClick(x: number, y: number): void {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // World name input field
    if (x >= centerX - 200 && x <= centerX + 200 && y >= centerY - 100 && y <= centerY - 60) {
      // Focus on input (handled by keyboard)
      return;
    }

    // Join/Create button
    if (x >= centerX - 100 && x <= centerX + 100 && y >= centerY + 40 && y <= centerY + 80) {
      this.submit().catch(console.error);
      return;
    }

    // Recent worlds
    const recentStartY = centerY + 120;
    for (let i = 0; i < this.recentWorlds.length; i++) {
      const worldY = recentStartY + i * 40;
      if (x >= centerX - 200 && x <= centerX + 200 && y >= worldY && y <= worldY + 35) {
        this.worldName = this.recentWorlds[i];
        this.submit();
        return;
      }
    }

    // Logout button
    if (x >= 20 && x <= 120 && y >= 20 && y <= 50) {
      // Logout handled by database session
      window.location.reload();
      return;
    }
  }

  public render(): void {
    // Clear canvas with light gradient background (matching login screen)
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#E3F2FD');
    gradient.addColorStop(1, '#BBDEFB');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Title
    this.ctx.fillStyle = '#3F51B5';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Select World', centerX, centerY - 200);

    // Username display
    this.ctx.fillStyle = '#5C6BC0';
    this.ctx.font = '18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Logged in as: ${this.username}`, centerX, centerY - 160);

    // World name input
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(centerX - 200, centerY - 100, 400, 40);
    this.ctx.strokeStyle = '#5C6BC0';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 200, centerY - 100, 400, 40);
    
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'left';
    const worldText = this.worldName || 'Enter world name (letters/numbers only)...';
    this.ctx.fillStyle = this.worldName ? '#212121' : '#9E9E9E';
    this.ctx.fillText(worldText, centerX - 190, centerY - 70);

    // Error message
    if (this.errorMessage) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = '16px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.errorMessage, centerX, centerY - 20);
    }

    // Join/Create button
    // World existence check is async - show generic button text
    const buttonText = this.worldName.trim() ? 'Join/Create World' : 'Enter World Name';
    
    this.ctx.fillStyle = '#5C6BC0';
    this.ctx.fillRect(centerX - 100, centerY + 40, 200, 40);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(buttonText, centerX, centerY + 68);

    // Recent worlds
    if (this.recentWorlds.length > 0) {
      this.ctx.fillStyle = '#5C6BC0';
      this.ctx.font = '16px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Recent Worlds:', centerX, centerY + 100);

      const recentStartY = centerY + 120;
      for (let i = 0; i < this.recentWorlds.length; i++) {
        const worldY = recentStartY + i * 40;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(centerX - 200, worldY, 400, 35);
        this.ctx.strokeStyle = '#5C6BC0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - 200, worldY, 400, 35);
        
        this.ctx.fillStyle = '#3F51B5';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.recentWorlds[i], centerX, worldY + 25);
      }
    }

    // Logout button
    this.ctx.fillStyle = '#E57373';
    this.ctx.fillRect(20, 20, 100, 30);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Log Out', 70, 42);

    // Instructions
    this.ctx.fillStyle = '#7986CB';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Enter: Join/Create World', centerX, CANVAS_HEIGHT - 30);
  }

  public cleanup(): void {
    // Remove event listeners if needed
  }
}

