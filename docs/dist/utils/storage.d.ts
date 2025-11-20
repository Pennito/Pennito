export interface Account {
    username: string;
    password: string;
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
export declare class StorageManager {
    static createAccount(username: string, password: string): boolean;
    static login(username: string, password: string): Account | null;
    static getActiveUser(): string | null;
    static logout(): void;
    static getAccounts(): Account[];
    static updateAccount(username: string, updates: Partial<Account>): void;
    static saveWorld(worldName: string, worldData: WorldData): void;
    static loadWorld(worldName: string): WorldData | null;
    static worldExists(worldName: string): boolean;
    static getAllWorlds(): WorldData[];
    static deleteWorld(worldName: string): void;
}
//# sourceMappingURL=storage.d.ts.map