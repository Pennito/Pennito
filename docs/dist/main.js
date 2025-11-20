import { LoginScreen } from './screens/login.js';
import { WorldSelectScreen } from './screens/worldSelect.js';
import { GameScreen } from './screens/game.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_VERSION } from './utils/constants.js';
import { DatabaseSync } from './network/sync.js';
console.log('Game script loading...');
class App {
    constructor(canvas) {
        this.currentScreen = 'login';
        this.loginScreen = null;
        this.worldSelectScreen = null;
        this.gameScreen = null;
        this.currentUsername = null;
        this.animationFrame = 0;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        this.setupInput();
        this.init();
    }
    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        });
    }
    handleClick(x, y) {
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
    init() {
        // Start with login screen
        this.showLoginScreen();
    }
    showLoginScreen() {
        this.currentScreen = 'login';
        this.gameScreen?.cleanup();
        this.gameScreen = null;
        this.worldSelectScreen?.cleanup();
        this.worldSelectScreen = null;
        this.loginScreen = new LoginScreen(this.canvas, (username) => {
            this.currentUsername = username;
            this.showWorldSelectScreen();
        });
    }
    showWorldSelectScreen() {
        if (!this.currentUsername)
            return;
        this.currentScreen = 'worldSelect';
        this.loginScreen?.cleanup();
        this.loginScreen = null;
        this.gameScreen?.cleanup();
        this.gameScreen = null;
        this.worldSelectScreen = new WorldSelectScreen(this.canvas, this.currentUsername, (worldName, isNew) => {
            this.showGameScreen(worldName, isNew);
        });
    }
    showGameScreen(worldName, isNew) {
        if (!this.currentUsername)
            return;
        this.currentScreen = 'game';
        this.loginScreen?.cleanup();
        this.loginScreen = null;
        this.worldSelectScreen?.cleanup();
        this.worldSelectScreen = null;
        this.gameScreen = new GameScreen(this.canvas, this.currentUsername, worldName, isNew, () => {
            // Return to world select
            this.showWorldSelectScreen();
        });
    }
    render() {
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            switch (this.currentScreen) {
                case 'login':
                    if (this.loginScreen) {
                        this.loginScreen.render();
                    }
                    else {
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
        }
        catch (error) {
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
    update(deltaTime) {
        if (this.currentScreen === 'game') {
            this.gameScreen?.update(deltaTime);
        }
    }
    gameLoop(currentTime) {
        const deltaTime = currentTime - (this.animationFrame || currentTime);
        this.animationFrame = currentTime;
        this.update(deltaTime);
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    start() {
        console.log('App started');
        this.animationFrame = performance.now();
        this.gameLoop(performance.now());
    }
}
// Automatic reset on version change ONLY - no manual reset available
async function checkVersionReset() {
    const STORAGE_KEY = 'ipenno_game_version';
    const storedVersion = localStorage.getItem(STORAGE_KEY);
    if (storedVersion !== GAME_VERSION) {
        console.log(`[AUTO-RESET] Version changed: ${storedVersion} → ${GAME_VERSION}`);
        console.log('[AUTO-RESET] Broadcasting update message and performing reset...');
        try {
            const dbSync = DatabaseSync.getInstance();
            // First, broadcast global update message to all active players
            await dbSync.broadcastGlobalMessage('{Global Message ; game updating}');
            // Wait a moment for message to be received
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Then clear all data
            await dbSync.deleteAllWorlds();
            console.log('[AUTO-RESET] ✅ All data cleared!');
            // Store new version
            localStorage.setItem(STORAGE_KEY, GAME_VERSION);
            console.log(`[AUTO-RESET] Version ${GAME_VERSION} stored`);
            // Force logout and refresh
            console.log('[AUTO-RESET] Forcing page refresh...');
            alert('Game is updating! Please refresh the page.');
            window.location.reload();
        }
        catch (error) {
            console.error('[AUTO-RESET] Error during automatic reset:', error);
            // Still store version to prevent infinite loops
            localStorage.setItem(STORAGE_KEY, GAME_VERSION);
            // Force refresh anyway
            window.location.reload();
        }
    }
    else {
        console.log(`[AUTO-RESET] Version ${GAME_VERSION} matches stored version - no reset needed`);
    }
}
// NO manual reset function - removed for security
// Reset only happens automatically on version updates
// Initialize app
async function initApp() {
    console.log('Initializing app...');
    // Check version and auto-reset if needed (for demo game)
    await checkVersionReset();
    const canvas = document.getElementById('gameCanvas');
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
    }
    catch (error) {
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
}
else {
    initApp();
}
//# sourceMappingURL=main.js.map