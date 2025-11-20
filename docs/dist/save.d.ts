import { GameState } from './utils/types.js';
export declare class SaveManager {
    save(gameState: GameState): void;
    load(): GameState | null;
    hasSave(): boolean;
    deleteSave(): void;
}
//# sourceMappingURL=save.d.ts.map