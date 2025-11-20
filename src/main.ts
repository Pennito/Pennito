import { LoginScreen } from './screens/login.js';
import { WorldSelectScreen } from './screens/worldSelect.js';
import { GameScreen } from './screens/game.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_VERSION } from './utils/constants.js';
import { DatabaseSync } from './network/sync.js';

console.log('Game script loading...');

type ScreenType = 'login' | 'worldSelect' | 'game';

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentScreen: ScreenType = 'login';
  private loginScreen: LoginScreen | null = null;
  private worldSelectScreen: WorldSelectScreen | null = null;
  private gameScreen: GameScreen | null = null;
  private currentUsername: string | null = null;
  private animationFrame: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    this.setupInput();
    this.init();
  }

  private setupInput(): void {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleClick(x, y);
    });
  }

  private handleClick(x: number, y: number): void {
    switch (this.currentScreen) {
      case 'login':
        this.loginScreen?.handleClick(x, y);
        break;
      case 'worldSelect':
        this.worldSelectScreen?.handleClick(x, y);
        break;
      case 'game':
        // Game handles its own clicks
        break;
    }
  }

  private init(): void {
    // Start with login screen
    this.showLoginScreen();
  }

  private showLoginScreen(): void {
    this.currentScreen = 'login';
    this.gameScreen?.cleanup();
    this.gameScreen = null;
    this.worldSelectScreen?.cleanup();
    this.worldSelectScreen = null;

    this.loginScreen = new LoginScreen(this.canvas, (username: string) => {
      this.currentUsername = username;
      this.showWorldSelectScreen();
    });
  }

  private showWorldSelectScreen(): void {
    if (!this.currentUsername) return;

    this.currentScreen = 'worldSelect';
    this.loginScreen?.cleanup();
    this.loginScreen = null;
    this.gameScreen?.cleanup();
    this.gameScreen = null;

    this.worldSelectScreen = new WorldSelectScreen(
      this.canvas,
      this.currentUsername,
      (worldName: string, isNew: boolean) => {
        this.showGameScreen(worldName, isNew);
      }
    );
  }

  private showGameScreen(worldName: string, isNew: boolean): void {
    if (!this.currentUsername) return;

    this.currentScreen = 'game';
    this.loginScreen?.cleanup();
    this.loginScreen = null;
    this.worldSelectScreen?.cleanup();
    this.worldSelectScreen = null;

    this.gameScreen = new GameScreen(
      this.canvas,
      this.currentUsername,
      worldName,
      isNew,
      () => {
        // Return to world select
        this.showWorldSelectScreen();
      }
    );
  }

  public render(): void {
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      switch (this.currentScreen) {
        case 'login':
          if (this.loginScreen) {
            this.loginScreen.render();
          } else {
            // Fallback: draw something if login screen not initialized
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
          }
          break;
        case 'worldSelect':
          this.worldSelectScreen?.render();
          break;
        case 'game':
          this.gameScreen?.render();
          break;
      }
    } catch (error) {
      console.error('Error in render:', error);
      // Fallback rendering
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '20px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Render Error - Check Console', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  public update(deltaTime: number): void {
    if (this.currentScreen === 'game') {
      this.gameScreen?.update(deltaTime);
    }
  }

  public gameLoop(currentTime: number): void {
    const deltaTime = currentTime - (this.animationFrame || currentTime);
    this.animationFrame = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  public start(): void {
    console.log('App started');
    this.animationFrame = performance.now();
    this.gameLoop(performance.now());
  }
}

// Check for new version by fetching the main.js file and checking its cache buster
async function checkForCodeUpdate(): Promise<boolean> {
  try {
    // Fetch the current index.html to check the version in the script tag
    const response = await fetch(`${window.location.origin}${window.location.pathname}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) return false;
    
    const html = await response.text();
    const versionMatch = html.match(/main\.js\?v=([\d.]+)/);
    
    if (versionMatch && versionMatch[1] !== GAME_VERSION) {
      console.log(`[AUTO-UPDATE] 🔄 New version detected: ${GAME_VERSION} → ${versionMatch[1]}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[AUTO-UPDATE] Error checking for updates:', error);
    return false;
  }
}

// Automatic reset on version change ONLY - no manual reset available
async function checkVersionReset(): Promise<void> {
  const STORAGE_KEY = 'ipenno_game_version';
  const storedVersion = localStorage.getItem(STORAGE_KEY);
  
  console.log(`[VERSION-CHECK] Stored: "${storedVersion}", Current: "${GAME_VERSION}"`);
  
  if (storedVersion !== GAME_VERSION) {
    console.log(`[AUTO-RESET] 🔄 Version changed: ${storedVersion || 'none'} → ${GAME_VERSION}`);
    console.log('[AUTO-RESET] Broadcasting update message, logging out everyone, and performing reset...');
    
    try {
      const dbSync = DatabaseSync.getInstance();
      
      // First, broadcast global update message to all active players
      await dbSync.broadcastGlobalMessage('{Global Message ; game updating}');
      
      // Wait a moment for message to be received
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Delete all active players (force logout everyone)
      try {
        const { getSupabaseClient } = await import('./network/supabase.js');
        const supabase = await getSupabaseClient();
        if (supabase) {
          const { error: deleteError } = await supabase
            .from('active_players')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
          
          if (deleteError) {
            console.error('[AUTO-RESET] Error deleting active players:', deleteError);
          } else {
            console.log('[AUTO-RESET] ✅ All active players logged out');
          }
        }
      } catch (error) {
        console.error('[AUTO-RESET] Error during player logout:', error);
      }
      
      // Then clear all data (users, worlds, inventories) - Dev account is preserved
      await dbSync.deleteAllWorlds();
      console.log('[AUTO-RESET] ✅ All data cleared! (Dev account preserved)');
      
      // Store new version
      localStorage.setItem(STORAGE_KEY, GAME_VERSION);
      console.log(`[AUTO-RESET] Version ${GAME_VERSION} stored`);
      
      // Force logout and refresh
      console.log('[AUTO-RESET] Forcing page refresh...');
      alert(`Game updated to v${GAME_VERSION}!\n\nAll players have been logged out.\nThe page will refresh now.`);
      window.location.reload();
    } catch (error) {
      console.error('[AUTO-RESET] Error during automatic reset:', error);
      // Still store version to prevent infinite loops
      localStorage.setItem(STORAGE_KEY, GAME_VERSION);
      // Force refresh anyway
      alert(`Game updated to v${GAME_VERSION}!\n\nThe page will refresh now.`);
      window.location.reload();
    }
  } else {
    console.log(`[AUTO-RESET] Version ${GAME_VERSION} matches stored version - no reset needed`);
    
    // Check for code updates periodically (every 30 seconds)
    setInterval(async () => {
      const hasUpdate = await checkForCodeUpdate();
      if (hasUpdate) {
        console.log('[AUTO-UPDATE] 🔄 New version available! Refreshing...');
        alert('Game update available! Refreshing...');
        window.location.reload();
      }
    }, 30000); // Check every 30 seconds
  }
}

// NO manual reset function - removed for security
// Reset only happens automatically on version updates

// Initialize app
async function initApp() {
  console.log(`[INIT] Game version: ${GAME_VERSION}`);
  
  // Check version and auto-reset if needed FIRST (before anything else)
  await checkVersionReset();
  
  // Ensure Dev account exists (even if no reset happened)
  const dbSync = DatabaseSync.getInstance();
  await dbSync.ensureDevAccount();
  
  // Store current version in Supabase (for remote version checking)
  await dbSync.setGameVersion(GAME_VERSION);
  
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found!');
    setTimeout(initApp, 100);
    return;
  }

  console.log('Canvas found, creating app...');
  
  try {
    const app = new App(canvas);
    console.log('App created, starting...');
    app.start();
    console.log('App started!');
    
    // Force initial render
    setTimeout(() => {
      app.render();
      console.log('Initial render completed');
    }, 100);
  } catch (error) {
    console.error('Error initializing app:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Fallback: draw error message on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Initialization Error - Check Console', canvas.width / 2, canvas.height / 2);
    }
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
