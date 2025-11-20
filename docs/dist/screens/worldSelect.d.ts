export type WorldSelectResult = {
    worldName: string;
    isNew: boolean;
};
export declare class WorldSelectScreen {
    private canvas;
    private ctx;
    private worldName;
    private errorMessage;
    private recentWorlds;
    private onWorldSelected;
    private dbSync;
    private username;
    private worldNameInput;
    constructor(canvas: HTMLCanvasElement, username: string, onWorldSelected: (worldName: string, isNew: boolean) => void);
    private createMobileInput;
    private loadRecentWorlds;
    private setupInput;
    private handleKeyDown;
    private submit;
    handleClick(x: number, y: number): void;
    render(): void;
    cleanup(): void;
}
//# sourceMappingURL=worldSelect.d.ts.map