export declare function isMobile(): boolean;
export declare class MobileControls {
    private canvas;
    private leftButton;
    private rightButton;
    private jumpButton;
    private isLeftPressed;
    private isRightPressed;
    private isJumpPressed;
    private virtualKeyboard;
    private chatInput;
    private isMobile;
    constructor(canvas: HTMLCanvasElement);
    private preventZoom;
    private createTouchControls;
    private createVirtualKeyboard;
    showKeyboard(onSend: (text: string) => void): void;
    hideKeyboard(): void;
    isLeftHeld(): boolean;
    isRightHeld(): boolean;
    isJumpHeld(): boolean;
    isMobileDevice(): boolean;
    cleanup(): void;
}
//# sourceMappingURL=mobile.d.ts.map