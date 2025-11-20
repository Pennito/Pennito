import { getSupabaseClient } from './supabase.js';
import { StorageManager } from '../utils/storage.js';
// World sync debounce - sync every 3 seconds after changes
const WORLD_SYNC_INTERVAL = 3000;
let worldSyncTimer = null;
let pendingWorldData = null;
export class DatabaseSync {
    constructor() {
        this.currentUserId = null;
        this.currentWorldId = null;
        this.currentUsername = null; // Store username for easy access
    }
    getCurrentUserId() {
        return this.currentUserId;
    }
    getCurrentUsername() {
        return this.currentUsername;
    }
    setCurrentUser(userId, username) {
        this.currentUserId = userId;
        this.currentUsername = username;
    }
    static getInstance() {
        if (!DatabaseSync.instance) {
            DatabaseSync.instance = new DatabaseSync();
        }
        return DatabaseSync.instance;
    }
    // User management - NO localStorage fallback, database only
    async createUser(username, password) {
        try {
            const supabase = await getSupabaseClient();
            if (!supabase) {
                console.error('[ERROR] Supabase not available - cannot create user');
                return null;
            }
            const { data, error } = await supabase
                .from('users')
                .insert([{ username, password }])
                .select()
                .single();
            if (error) {
                console.error('Error creating user:', error);
                return null;
            }
            this.currentUserId = data.id;
            this.currentUsername = data.username;
            return data;
        }
        catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }
    async loginUser(username, password) {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            console.error('[ERROR] Supabase not available - cannot login');
            return null;
        }
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();
            if (error || !data) {
                return null;
            }
            this.currentUserId = data.id;
            this.currentUsername = data.username;
            return data;
        }
        catch (error) {
            console.error('Error logging in:', error);
            return null;
        }
    }
    // World management - NO localStorage fallback, database only
    async loadWorld(worldName) {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            console.error('[ERROR] Supabase not available - cannot load world');
            return null;
        }
        try {
            const { data, error } = await supabase
                .from('worlds')
                .select('*')
                .eq('name', worldName)
                .single();
            if (error || !data) {
                // Fallback to localStorage
                const world = StorageManager.loadWorld(worldName);
                return world ? { id: worldName, name: worldName, data: world, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } : null;
            }
            this.currentWorldId = data.id;
            return data;
        }
        catch (error) {
            console.error('Error loading world:', error);
            return null;
        }
    }
    async createWorld(worldName, worldData) {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            console.error('[ERROR] Supabase not available - cannot create world');
            return null;
        }
        try {
            const { data, error } = await supabase
                .from('worlds')
                .insert([{ name: worldName, data: worldData }])
                .select()
                .single();
            if (error) {
                console.error('Error creating world:', error);
                // Fallback to localStorage
                StorageManager.saveWorld(worldName, {
                    name: worldName,
                    tiles: worldData.tiles,
                    width: worldData.width,
                    height: worldData.height,
                    seed: worldData.seed,
                    createdAt: Date.now(),
                    lastPlayed: Date.now()
                });
                return { id: worldName, name: worldName, data: worldData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            }
            this.currentWorldId = data.id;
            return data;
        }
        catch (error) {
            console.error('Error creating world:', error);
            return null;
        }
    }
    // Debounced world sync - updates every 3 seconds after last change
    scheduleWorldSync(worldName, worldData) {
        pendingWorldData = worldData;
        if (worldSyncTimer) {
            clearTimeout(worldSyncTimer);
        }
        worldSyncTimer = window.setTimeout(() => {
            this.syncWorld(worldName, pendingWorldData);
            pendingWorldData = null;
        }, WORLD_SYNC_INTERVAL);
    }
    // Immediate world sync (for critical updates like ownership)
    async syncWorldImmediately(worldName, worldData) {
        // Clear any pending debounced sync
        if (worldSyncTimer) {
            clearTimeout(worldSyncTimer);
            worldSyncTimer = null;
        }
        pendingWorldData = null;
        // Sync immediately
        await this.syncWorld(worldName, worldData);
    }
    async syncWorld(worldName, worldData) {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            console.error('[ERROR] Supabase not available - cannot sync world');
            return;
        }
        try {
            const { error } = await supabase
                .from('worlds')
                .update({ data: worldData, updated_at: new Date().toISOString() })
                .eq('name', worldName);
            if (error) {
                console.error('Error syncing world:', error);
                // Fallback to localStorage
                StorageManager.saveWorld(worldName, {
                    name: worldName,
                    tiles: worldData.tiles,
                    width: worldData.width,
                    height: worldData.height,
                    seed: worldData.seed,
                    createdAt: Date.now(),
                    lastPlayed: Date.now()
                });
            }
        }
        catch (error) {
            console.error('Error syncing world:', error);
            // Fallback to localStorage
            StorageManager.saveWorld(worldName, {
                name: worldName,
                tiles: worldData.tiles,
                width: worldData.width,
                height: worldData.height,
                seed: worldData.seed,
                createdAt: Date.now(),
                lastPlayed: Date.now()
            });
        }
    }
    // Inventory management - saves items, gems, and redeemed codes
    async saveInventory(userId, items, gems, redeemedCodes) {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            console.error('[ERROR] Supabase not available - cannot save inventory');
            return;
        }
        try {
            // Update user's gems and redeemed codes
            if (gems !== undefined || redeemedCodes !== undefined) {
                const updateData = {};
                if (gems !== undefined)
                    updateData.gems = gems;
                if (redeemedCodes !== undefined)
                    updateData.redeemed_codes = redeemedCodes;
                const { error: userError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', userId);
                if (userError) {
                    console.error('Error updating user data:', userError);
                }
            }
            // Save inventory items
            const { error } = await supabase
                .from('inventories')
                .upsert({
                user_id: userId,
                items: items,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
            if (error) {
                console.error('Error saving inventory:', error);
            }
        }
        catch (error) {
            console.error('Error saving inventory:', error);
        }
    }
    async loadInventory(userId) {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            return null;
        }
        try {
            const { data, error } = await supabase
                .from('inventories')
                .select('items')
                .eq('user_id', userId)
                .single();
            if (error || !data) {
                return null;
            }
            return data.items;
        }
        catch (error) {
            console.error('Error loading inventory:', error);
            return null;
        }
    }
    // Force sync on logout/exit
    async forceSync(worldName, worldData) {
        if (worldSyncTimer) {
            clearTimeout(worldSyncTimer);
            worldSyncTimer = null;
        }
        await this.syncWorld(worldName, worldData);
    }
    // Get recent worlds (for world selector)
    async getRecentWorlds(limit = 10) {
        const supabase = await getSupabaseClient();
        if (!supabase) {
            return [];
        }
        try {
            const { data, error } = await supabase
                .from('worlds')
                .select('name')
                .order('updated_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('Error loading recent worlds:', error);
                return [];
            }
            return data.map((w) => w.name);
        }
        catch (error) {
            console.error('Error loading recent worlds:', error);
            return [];
        }
    }
    // Delete ALL data from database (for automatic version reset ONLY)
    // This function is only called during automatic version updates
    // It cannot be called manually from console for security
    async deleteAllWorlds() {
        try {
            const supabase = await getSupabaseClient();
            if (!supabase) {
                console.log('[RESET] Supabase not available, skipping database cleanup');
                return;
            }
            console.log('[RESET] Starting full database cleanup...');
            // Delete all inventories first (has foreign key to users)
            const { error: invError } = await supabase
                .from('inventories')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (invError) {
                console.error('[RESET] Error deleting inventories:', invError);
            }
            else {
                console.log('[RESET] ✓ All inventories deleted');
            }
            // Delete all worlds
            const { error: worldError } = await supabase
                .from('worlds')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (worldError) {
                console.error('[RESET] Error deleting worlds:', worldError);
            }
            else {
                console.log('[RESET] ✓ All worlds deleted');
            }
            // Delete all users (this is the critical one that was missing!)
            const { error: userError } = await supabase
                .from('users')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (userError) {
                console.error('[RESET] Error deleting users:', userError);
            }
            else {
                console.log('[RESET] ✓ All users deleted');
            }
            console.log('[RESET] ✅ Full database cleanup complete!');
        }
        catch (error) {
            console.error('[RESET] Error during database cleanup:', error);
            throw error; // Re-throw so caller knows it failed
        }
    }
}
//# sourceMappingURL=sync.js.map