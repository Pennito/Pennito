export declare enum GameMode {
    MENU = 0,
    PLAYING = 1,
    PAUSED = 2
}
export declare class Game {
    private canvas;
    private ctx;
    private world;
    private player;
    private input;
    private camera;
    private ui;
    private saveManager;
    private gameMode;
    private menuSelectedIndex;
    private dayTime;
    private lastTime;
    private lastDayTimeUpdate;
    private breakingTile;
    private breakDuration;
    private lastMenuInput;
    private menuInputDelay;
    constructor(canvas: HTMLCanvasElement);
    startNewGame(): void;
    loadGame(): void;
    saveGame(): void;
    private updateMenu;
    private updatePlaying;
    private updatePaused;
    update(deltaTime: number): void;
    render(): void;
    gameLoop(currentTime: number): void;
    start(): void;
}
//# sourceMappingURL=game.d.ts.map