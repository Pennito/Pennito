export declare class Camera {
    x: number;
    y: number;
    private targetX;
    private targetY;
    private followSpeed;
    constructor();
    follow(targetX: number, targetY: number, targetWidth: number, targetHeight: number): void;
    setPosition(x: number, y: number): void;
}
//# sourceMappingURL=camera.d.ts.map