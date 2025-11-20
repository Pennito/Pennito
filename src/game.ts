import { World } from './world';
import { Player } from './player';
import { InputManager } from './input';
import { Camera } from './camera';
import { UI } from './ui';
import { TileType, GameState } from './utils/types';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, DAY_CYCLE_DURATION, WORLD_WIDTH, WORLD_HEIGHT } from './utils/constants';
import { SaveManager } from './save';

export enum GameMode {
  MENU,
  PLAYING,
  PAUSED
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: World;
  private player: Player;
  private input: InputManager;
  private camera: Camera;
  private ui: UI;
  private saveManager: SaveManager;
  
  private gameMode: GameMode = GameMode.MENU;
  private menuSelectedIndex: number = 0;
  private dayTime: number = 0.5; // Start at noon
  private lastTime: number = 0;
  private lastDayTimeUpdate: number = 0;
  private breakingTile: { x: number; y: number; startTime: number } | null = null;
  private breakDuration: number = 500; // ms to break a tile
  private lastMenuInput: number = 0;
  private menuInputDelay: number = 200; // ms between menu inputs

  constructor(canvas: HTMLCanvasElement) {
    console.log('Game constructor called');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    if (!this.ctx) {
      console.error('Failed to get 2d context from canvas!');
      throw new Error('Failed to get 2d context');
    }
    
    console.log('Canvas context obtained, setting dimensions...');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);

    this.input = new InputManager(canvas);
    this.camera = new Camera();
    this.ui = new UI(canvas);
    this.saveManager = new SaveManager();

    // Initialize with placeholder world/player (will be replaced when game starts)
    this.world = new World();
    this.player = new Player(0, 0);
    console.log('Game constructor completed');
  }

  public startNewGame(): void {
    this.world = new World(WORLD_WIDTH, WORLD_HEIGHT);
    const spawnX = WORLD_WIDTH * TILE_SIZE / 2;
    this.player = new Player(spawnX, 0);
    
    // Find ground position for player (first solid tile from top)
    const tileX = Math.floor(spawnX / TILE_SIZE);
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (this.world.isSolid(tileX, y)) {
        this.player.y = y * TILE_SIZE - this.player.height;
        break;
      }
    }
    
    this.camera.setPosition(this.player.x, this.player.y);
    this.dayTime = 0.5;
    this.gameMode = GameMode.PLAYING;
  }

  public loadGame(): void {
    const saved = this.saveManager.load();
    if (saved) {
      this.world.loadWorldData(saved.world);
      this.player.loadPlayerData(saved.player);
      this.dayTime = saved.dayTime || 0.5;
      this.camera.setPosition(this.player.x, this.player.y);
      this.gameMode = GameMode.PLAYING;
    } else {
      // No save found, start new game
      this.startNewGame();
    }
  }

  public saveGame(): void {
    const gameState: GameState = {
      world: this.world.getWorldData(),
      player: this.player.getPlayerData(),
      dayTime: this.dayTime,
      isPaused: false,
      isMenuOpen: false
    };
    this.saveManager.save(gameState);
  }

  private updateMenu(): void {
    const options = this.saveManager.hasSave() 
      ? ['New World', 'Continue', 'Exit']
      : ['New World', 'Exit'];

    const now = Date.now();
    const canInput = now - this.lastMenuInput > this.menuInputDelay;

    if (canInput) {
      if (this.input.isKeyPressed('arrowdown') || this.input.isKeyPressed('s')) {
        this.menuSelectedIndex = (this.menuSelectedIndex + 1) % options.length;
        this.lastMenuInput = now;
      }
      if (this.input.isKeyPressed('arrowup') || this.input.isKeyPressed('w')) {
        this.menuSelectedIndex = (this.menuSelectedIndex - 1 + options.length) % options.length;
        this.lastMenuInput = now;
      }
      if (this.input.isKeyPressed('enter') || this.input.isKeyPressed(' ')) {
        if (options[this.menuSelectedIndex] === 'New World') {
          this.startNewGame();
        } else if (options[this.menuSelectedIndex] === 'Continue') {
          this.loadGame();
        } else if (options[this.menuSelectedIndex] === 'Exit') {
          // Could close window or show message
          console.log('Exit game');
        }
        this.lastMenuInput = now;
      }
    }

    // Handle mouse clicks on menu
    if (this.input.isMouseButtonPressed(0)) {
      const mouseY = this.input.mouseY;
      const menuY = CANVAS_HEIGHT / 2 - 50;
      const optionHeight = 40;
      const clickedIndex = Math.floor((mouseY - menuY) / optionHeight);
      
      if (clickedIndex >= 0 && clickedIndex < options.length) {
        this.menuSelectedIndex = clickedIndex;
        if (options[this.menuSelectedIndex] === 'New World') {
          this.startNewGame();
        } else if (options[this.menuSelectedIndex] === 'Continue') {
          this.loadGame();
        } else if (options[this.menuSelectedIndex] === 'Exit') {
          console.log('Exit game');
        }
      }
    }
  }

  private updatePlaying(deltaTime: number): void {
    // Handle pause
    if (this.input.isKeyPressed('escape')) {
      this.gameMode = GameMode.PAUSED;
      return;
    }

    // Inventory slot selection
    for (let i = 1; i <= 8; i++) {
      if (this.input.isKeyPressed(i.toString())) {
        this.player.selectedSlot = i - 1;
      }
    }

    // Player movement
    const moveLeft = this.input.isKeyPressed('a') || this.input.isKeyPressed('arrowleft');
    const moveRight = this.input.isKeyPressed('d') || this.input.isKeyPressed('arrowright');
    const jump = this.input.isKeyPressed('w') || this.input.isKeyPressed(' ') || this.input.isKeyPressed('arrowup');

    this.player.update(this.world, moveLeft, moveRight, jump);

    // Camera follow
    this.camera.follow(this.player.x, this.player.y, this.player.width, this.player.height);

    // Update mouse world position
    this.input.updateMouseWorld(this.camera.x, this.camera.y);

    // Block interaction
    const mouseTile = this.input.getMouseTile(TILE_SIZE);

    // Left click - break block
    if (this.input.isMouseButtonPressed(0)) {
      const tile = this.world.getTile(mouseTile.x, mouseTile.y);
      if (tile && tile.type !== TileType.AIR) {
        if (!this.breakingTile || 
            this.breakingTile.x !== mouseTile.x || 
            this.breakingTile.y !== mouseTile.y) {
          this.breakingTile = { x: mouseTile.x, y: mouseTile.y, startTime: Date.now() };
        }
        
        const breakTime = Date.now() - this.breakingTile.startTime;
        if (breakTime >= this.breakDuration) {
          const broken = this.world.damageTile(mouseTile.x, mouseTile.y, tile.maxHealth);
          if (broken) {
            this.player.addToInventory(tile.type, 1);
            this.breakingTile = null;
          }
        }
      }
    } else {
      this.breakingTile = null;
    }

    // Right click - place block
    if (this.input.isMouseButtonPressed(2)) {
      const selectedItem = this.player.getSelectedItem();
      if (selectedItem && selectedItem.tileType !== TileType.AIR) {
        const tile = this.world.getTile(mouseTile.x, mouseTile.y);
        if (tile && tile.type === TileType.AIR) {
          // Check if player is not standing on this tile
          const playerTileX = Math.floor(this.player.x / TILE_SIZE);
          const playerTileY = Math.floor(this.player.y / TILE_SIZE);
          
          if (mouseTile.x !== playerTileX || mouseTile.y !== playerTileY) {
            if (this.player.useFromInventory(selectedItem.tileType)) {
              this.world.setTile(mouseTile.x, mouseTile.y, selectedItem.tileType);
            }
          }
        }
      }
    }

    // Update day/night cycle
    const now = Date.now();
    if (now - this.lastDayTimeUpdate > 100) {
      this.dayTime += (deltaTime / DAY_CYCLE_DURATION) * 100;
      if (this.dayTime >= 1) {
        this.dayTime = 0;
      }
      this.lastDayTimeUpdate = now;
    }
  }

  private updatePaused(): void {
    const options = ['Resume', 'Save', 'Exit to Menu'];
    
    const now = Date.now();
    const canInput = now - this.lastMenuInput > this.menuInputDelay;

    if (canInput) {
      if (this.input.isKeyPressed('arrowdown') || this.input.isKeyPressed('s')) {
        this.menuSelectedIndex = (this.menuSelectedIndex + 1) % options.length;
        this.lastMenuInput = now;
      }
      if (this.input.isKeyPressed('arrowup') || this.input.isKeyPressed('w')) {
        this.menuSelectedIndex = (this.menuSelectedIndex - 1 + options.length) % options.length;
        this.lastMenuInput = now;
      }
      if (this.input.isKeyPressed('enter') || this.input.isKeyPressed(' ')) {
        if (options[this.menuSelectedIndex] === 'Resume') {
          this.gameMode = GameMode.PLAYING;
          this.menuSelectedIndex = 0;
        } else if (options[this.menuSelectedIndex] === 'Save') {
          this.saveGame();
          this.menuSelectedIndex = 0;
        } else if (options[this.menuSelectedIndex] === 'Exit to Menu') {
          this.gameMode = GameMode.MENU;
          this.menuSelectedIndex = 0;
        }
        this.lastMenuInput = now;
      }
    }
    if (this.input.isKeyPressed('escape')) {
      this.gameMode = GameMode.PLAYING;
      this.menuSelectedIndex = 0;
    }
  }

  public update(deltaTime: number): void {
    switch (this.gameMode) {
      case GameMode.MENU:
        this.updateMenu();
        break;
      case GameMode.PLAYING:
        this.updatePlaying(deltaTime);
        break;
      case GameMode.PAUSED:
        this.updatePaused();
        break;
    }
  }

  public render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameMode === GameMode.MENU) {
      const options = this.saveManager.hasSave() 
        ? ['New World', 'Continue', 'Exit']
        : ['New World', 'Exit'];
      try {
        this.ui.renderMenu('IPenno', options, this.menuSelectedIndex);
      } catch (error) {
        console.error('Error rendering menu:', error);
        // Fallback: draw something simple
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('IPenno', this.canvas.width / 2, this.canvas.height / 2);
      }
    } else if (this.gameMode === GameMode.PAUSED) {
      // Render game in background
      this.ui.renderSky();
      this.world.render(this.ctx, this.camera.x, this.camera.y, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.player.render(this.ctx, this.camera.x, this.camera.y);
      this.ui.renderInventory(this.player.inventory, this.player.selectedSlot);
      this.ui.renderHUD();
      
      // Render pause menu
      this.ui.renderMenu('Paused', ['Resume', 'Save', 'Exit to Menu'], this.menuSelectedIndex);
    } else {
      // Render game
      this.ui.renderSky();
      this.world.render(this.ctx, this.camera.x, this.camera.y, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.player.render(this.ctx, this.camera.x, this.camera.y);
      this.ui.renderInventory(this.player.inventory, this.player.selectedSlot);
      this.ui.renderHUD();

      // Render breaking progress
      if (this.breakingTile) {
        const tile = this.world.getTile(this.breakingTile.x, this.breakingTile.y);
        if (tile && tile.type !== TileType.AIR) {
          const breakTime = Date.now() - this.breakingTile.startTime;
          const progress = Math.min(breakTime / this.breakDuration, 1);
          const screenX = this.breakingTile.x * TILE_SIZE - this.camera.x;
          const screenY = this.breakingTile.y * TILE_SIZE - this.camera.y;
          
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          this.ctx.fillRect(screenX, screenY - 8, TILE_SIZE, 4);
          this.ctx.fillStyle = '#ffff00';
          this.ctx.fillRect(screenX, screenY - 8, TILE_SIZE * progress, 4);
        }
      }
    }
  }

  public gameLoop(currentTime: number): void {
    try {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;

      this.update(deltaTime);
      this.render();

      requestAnimationFrame((time) => this.gameLoop(time));
    } catch (error) {
      console.error('Error in game loop:', error);
      // Continue the loop even if there's an error
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  public start(): void {
    console.log('Game.start() called');
    this.lastTime = performance.now();
    this.lastDayTimeUpdate = Date.now();
    this.gameLoop(performance.now());
  }
}

