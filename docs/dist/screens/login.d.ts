export type LoginResult = {
    success: boolean;
    username?: string;
    error?: string;
};
export declare class LoginScreen {
    private canvas;
    private ctx;
    private username;
    private password;
    private isSignUp;
    private errorMessage;
    private selectedField;
    private onLoginSuccess;
    private connectionStatus;
    private ping;
    private statusMessage;
    private statusMessages;
    private currentStatusIndex;
    private statusAnimationTimer;
    private usernameInput;
    private passwordInput;
    private isMobile;
    constructor(canvas: HTMLCanvasElement, onLoginSuccess: (username: string) => void);
    private createMobileInputs;
    private updateMobileInputPositions;
    private updateMobileInputs;
    private setupInput;
    private handleKeyDown;
    private submit;
    handleClick(x: number, y: number): void;
    render(): void;
    cleanup(): void;
}
//# sourceMappingURL=login.d.ts.map