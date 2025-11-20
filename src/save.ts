import { GameState } from './utils/types.js';

const SAVE_KEY = 'sandbox-game-save';

export class SaveManager {
  public save(gameState: GameState): void {
    try {
      const data = JSON.stringify(gameState);
      localStorage.setItem(SAVE_KEY, data);
      console.log('Game saved successfully');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  public load(): GameState | null {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) {
        return null;
      }
      const gameState: GameState = JSON.parse(data);
      console.log('Game loaded successfully');
      return gameState;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  public hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  public deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
    console.log('Save deleted');
  }
}

