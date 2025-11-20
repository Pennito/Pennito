import { DatabaseUser, DatabaseWorld } from './supabase.js';
import { WorldData } from '../utils/types.js';
import { Item } from '../utils/types.js';
export declare class DatabaseSync {
    private static instance;
    private currentUserId;
    private currentWorldId;
    private currentUsername;
    private constructor();
    getCurrentUserId(): string | null;
    getCurrentUsername(): string | null;
    setCurrentUser(userId: string, username: string): void;
    static getInstance(): DatabaseSync;
    createUser(username: string, password: string): Promise<DatabaseUser | null>;
    loginUser(username: string, password: string): Promise<DatabaseUser | null>;
    loadWorld(worldName: string): Promise<DatabaseWorld | null>;
    createWorld(worldName: string, worldData: WorldData): Promise<DatabaseWorld | null>;
    scheduleWorldSync(worldName: string, worldData: WorldData): void;
    syncWorldImmediately(worldName: string, worldData: WorldData): Promise<void>;
    private syncWorld;
    saveInventory(userId: string, items: Item[], gems?: number, redeemedCodes?: string[]): Promise<void>;
    loadInventory(userId: string): Promise<Item[] | null>;
    forceSync(worldName: string, worldData: WorldData): Promise<void>;
    getRecentWorlds(limit?: number): Promise<string[]>;
    setGameVersion(version: string): Promise<void>;
    getGameVersion(): Promise<string | null>;
    broadcastGlobalMessage(message: string): Promise<void>;
    deleteAllWorlds(): Promise<void>;
    ensureDevAccount(): Promise<void>;
}
//# sourceMappingURL=sync.d.ts.map