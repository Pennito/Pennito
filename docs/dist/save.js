const SAVE_KEY = 'sandbox-game-save';
export class SaveManager {
    save(gameState) {
        try {
            const data = JSON.stringify(gameState);
            localStorage.setItem(SAVE_KEY, data);
            console.log('Game saved successfully');
        }
        catch (error) {
            console.error('Failed to save game:', error);
        }
    }
    load() {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            if (!data) {
                return null;
            }
            const gameState = JSON.parse(data);
            console.log('Game loaded successfully');
            return gameState;
        }
        catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }
    hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }
    deleteSave() {
        localStorage.removeItem(SAVE_KEY);
        console.log('Save deleted');
    }
}
//# sourceMappingURL=save.js.map