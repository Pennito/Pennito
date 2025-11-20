export interface Account {
  username: string;
  password: string; // Plain text for now, will encrypt later
  lastWorld?: string;
  createdAt: number;
}

export interface WorldData {
  name: string;
  tiles: any[][];
  width: number;
  height: number;
  seed: number;
  createdAt: number;
  lastPlayed: number;
}

// StorageManager is now deprecated - all data is stored in Supabase
// This class is kept for backward compatibility but all methods are no-ops
// All data should go through DatabaseSync instead
export class StorageManager {
  // All methods removed - use DatabaseSync instead
  // Kept for backward compatibility to avoid breaking imports
  
  public static createAccount(username: string, password: string): boolean {
    console.warn('[DEPRECATED] StorageManager.createAccount - use DatabaseSync.createUser instead');
    return false;
  }

  public static login(username: string, password: string): Account | null {
    console.warn('[DEPRECATED] StorageManager.login - use DatabaseSync.loginUser instead');
    return null;
  }

  public static getActiveUser(): string | null {
    // Active user is now stored in session/memory only, not localStorage
    return null;
  }

  public static logout(): void {
    // No-op - session is cleared in memory
  }

  public static getAccounts(): Account[] {
    console.warn('[DEPRECATED] StorageManager.getAccounts - use DatabaseSync instead');
    return [];
  }

  public static updateAccount(username: string, updates: Partial<Account>): void {
    console.warn('[DEPRECATED] StorageManager.updateAccount - use DatabaseSync instead');
  }

  public static saveWorld(worldName: string, worldData: WorldData): void {
    console.warn('[DEPRECATED] StorageManager.saveWorld - use DatabaseSync.syncWorld instead');
  }

  public static loadWorld(worldName: string): WorldData | null {
    console.warn('[DEPRECATED] StorageManager.loadWorld - use DatabaseSync.loadWorld instead');
    return null;
  }

  public static worldExists(worldName: string): boolean {
    console.warn('[DEPRECATED] StorageManager.worldExists - use DatabaseSync.loadWorld instead');
    return false;
  }

  public static getAllWorlds(): WorldData[] {
    console.warn('[DEPRECATED] StorageManager.getAllWorlds - use DatabaseSync instead');
    return [];
  }

  public static deleteWorld(worldName: string): void {
    console.warn('[DEPRECATED] StorageManager.deleteWorld - use DatabaseSync instead');
  }
}


