// StorageManager is now deprecated - all data is stored in Supabase
// This class is kept for backward compatibility but all methods are no-ops
// All data should go through DatabaseSync instead
export class StorageManager {
    // All methods removed - use DatabaseSync instead
    // Kept for backward compatibility to avoid breaking imports
    static createAccount(username, password) {
        console.warn('[DEPRECATED] StorageManager.createAccount - use DatabaseSync.createUser instead');
        return false;
    }
    static login(username, password) {
        console.warn('[DEPRECATED] StorageManager.login - use DatabaseSync.loginUser instead');
        return null;
    }
    static getActiveUser() {
        // Active user is now stored in session/memory only, not localStorage
        return null;
    }
    static logout() {
        // No-op - session is cleared in memory
    }
    static getAccounts() {
        console.warn('[DEPRECATED] StorageManager.getAccounts - use DatabaseSync instead');
        return [];
    }
    static updateAccount(username, updates) {
        console.warn('[DEPRECATED] StorageManager.updateAccount - use DatabaseSync instead');
    }
    static saveWorld(worldName, worldData) {
        console.warn('[DEPRECATED] StorageManager.saveWorld - use DatabaseSync.syncWorld instead');
    }
    static loadWorld(worldName) {
        console.warn('[DEPRECATED] StorageManager.loadWorld - use DatabaseSync.loadWorld instead');
        return null;
    }
    static worldExists(worldName) {
        console.warn('[DEPRECATED] StorageManager.worldExists - use DatabaseSync.loadWorld instead');
        return false;
    }
    static getAllWorlds() {
        console.warn('[DEPRECATED] StorageManager.getAllWorlds - use DatabaseSync instead');
        return [];
    }
    static deleteWorld(worldName) {
        console.warn('[DEPRECATED] StorageManager.deleteWorld - use DatabaseSync instead');
    }
}
//# sourceMappingURL=storage.js.map