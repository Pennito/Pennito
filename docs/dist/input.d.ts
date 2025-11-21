import { MobileControls } from './utils/mobile.js';
export declare class InputManager {
    private keys;
    private mouseButtons;
    private touchButtons;
    mouseX: number;
    mouseY: number;
    mouseWorldX: number;
    mouseWorldY: number;
    mobileControls: MobileControls | null;
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
    clearKey(key: string): void;
}
//# sourceMappingURL=input.d.ts.map