export declare class InputManager {
    private keys;
    private mouseButtons;
    mouseX: number;
    mouseY: number;
    mouseWorldX: number;
    mouseWorldY: number;
    private keyPresses;
    private lastJumpPress;
    private spacePressed;
    constructor(canvas: HTMLCanvasElement);
    private updateMousePosition;
    updateMouseWorld(cameraX: number, cameraY: number): void;
    isKeyPressed(key: string): boolean;
    wasKeyJustPressed(key: string): boolean;
    isMouseButtonPressed(button: number): boolean;
    getMouseTile(tileSize: number): {
        x: number;
        y: number;
    };
}
//# sourceMappingURL=input.d.ts.map