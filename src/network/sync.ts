import { getSupabaseClient, DatabaseUser, DatabaseWorld, DatabaseInventory } from './supabase.js';
import { StorageManager } from '../utils/storage.js';
import { WorldData } from '../utils/types.js';
import { Item } from '../utils/types.js';

// World sync debounce - sync every 3 seconds after changes
const WORLD_SYNC_INTERVAL = 3000;
let worldSyncTimer: number | null = null;
let pendingWorldData: WorldData | null = null;

export class DatabaseSync {
  private static instance: DatabaseSync;
  private currentUserId: string | null = null;
  private currentWorldId: string | null = null;
  private currentUsername: string | null = null; // Store username for easy access

  private constructor() {}
  
  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }
  
  public getCurrentUsername(): string | null {
    return this.currentUsername;
  }
  
  public setCurrentUser(userId: string, username: string): void {
    this.currentUserId = userId;
    this.currentUsername = username;
  }

  public static getInstance(): DatabaseSync {
    if (!DatabaseSync.instance) {
      DatabaseSync.instance = new DatabaseSync();
    }
    return DatabaseSync.instance;
  }

  // User management - NO localStorage fallback, database only
  public async createUser(username: string, password: string): Promise<DatabaseUser | null> {
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
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  public async loginUser(username: string, password: string): Promise<DatabaseUser | null> {
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
    } catch (error) {
      console.error('Error logging in:', error);
      return null;
    }
  }

  // World management - NO localStorage fallback, database only
  public async loadWorld(worldName: string): Promise<DatabaseWorld | null> {
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
    } catch (error) {
      console.error('Error loading world:', error);
      return null;
    }
  }

  public async createWorld(worldName: string, worldData: WorldData): Promise<DatabaseWorld | null> {
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
    } catch (error) {
      console.error('Error creating world:', error);
      return null;
    }
  }

  // Debounced world sync - updates every 3 seconds after last change
  public scheduleWorldSync(worldName: string, worldData: WorldData): void {
    pendingWorldData = worldData;

    if (worldSyncTimer) {
      clearTimeout(worldSyncTimer);
    }

    worldSyncTimer = window.setTimeout(() => {
      this.syncWorld(worldName, pendingWorldData!);
      pendingWorldData = null;
    }, WORLD_SYNC_INTERVAL);
  }

  // Immediate world sync (for critical updates like ownership)
  public async syncWorldImmediately(worldName: string, worldData: WorldData): Promise<void> {
    // Clear any pending debounced sync
    if (worldSyncTimer) {
      clearTimeout(worldSyncTimer);
      worldSyncTimer = null;
    }
    pendingWorldData = null;
    
    // Sync immediately
    await this.syncWorld(worldName, worldData);
  }

  private async syncWorld(worldName: string, worldData: WorldData): Promise<void> {
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
    } catch (error) {
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
  public async saveInventory(userId: string, items: Item[], gems?: number, redeemedCodes?: string[]): Promise<void> {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('[ERROR] Supabase not available - cannot save inventory');
      return;
    }

    try {
      // Update user's gems and redeemed codes
      if (gems !== undefined || redeemedCodes !== undefined) {
        const updateData: any = {};
        if (gems !== undefined) updateData.gems = gems;
        if (redeemedCodes !== undefined) updateData.redeemed_codes = redeemedCodes;
        
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
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  }

  public async loadInventory(userId: string): Promise<Item[] | null> {
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
    } catch (error) {
      console.error('Error loading inventory:', error);
      return null;
    }
  }

  // Force sync on logout/exit
  public async forceSync(worldName: string, worldData: WorldData): Promise<void> {
    if (worldSyncTimer) {
      clearTimeout(worldSyncTimer);
      worldSyncTimer = null;
    }
    await this.syncWorld(worldName, worldData);
  }

  // Get recent worlds (for world selector)
  public async getRecentWorlds(limit: number = 10): Promise<string[]> {
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

      return data.map((w: any) => w.name);
    } catch (error) {
      console.error('Error loading recent worlds:', error);
      return [];
    }
  }

  // Store game version in Supabase for remote version checking
  public async setGameVersion(version: string): Promise<void> {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      // Store version in a simple key-value table (or use a settings table)
      // For now, we'll use a simple approach with a 'game_settings' table
      // If table doesn't exist, this will fail gracefully
      const { error } = await supabase
        .from('game_settings')
        .upsert({ key: 'game_version', value: version, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error && error.code !== '42P01') { // 42P01 = table doesn't exist, which is OK
        console.warn('[VERSION-SYNC] Could not store version in Supabase:', error.message);
      }
    } catch (error) {
      // Table might not exist, that's OK
      console.log('[VERSION-SYNC] Version sync table not available (optional feature)');
    }
  }

  // Get game version from Supabase
  public async getGameVersion(): Promise<string | null> {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('game_settings')
        .select('value')
        .eq('key', 'game_version')
        .single();

      if (error || !data) return null;
      return data.value;
    } catch (error) {
      return null;
    }
  }

  // Broadcast global message to all active players
  public async broadcastGlobalMessage(message: string): Promise<void> {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        console.warn('[BROADCAST] Supabase not available');
        return;
      }

      // Use Supabase Realtime to broadcast message
      const channel = supabase.channel('global-updates');
      
      await channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'global_message',
            payload: { message: message, timestamp: Date.now() }
          });
          console.log('[BROADCAST] Global message sent:', message);
        }
      });
    } catch (error) {
      console.error('[BROADCAST] Error broadcasting message:', error);
    }
  }

  // Delete ALL data from database (for automatic version reset ONLY)
  // This function is only called during automatic version updates
  // It cannot be called manually from console for security
  public async deleteAllWorlds(): Promise<void> {

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
      } else {
        console.log('[RESET] ✓ All inventories deleted');
      }

      // Delete all worlds
      const { error: worldError } = await supabase
        .from('worlds')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (worldError) {
        console.error('[RESET] Error deleting worlds:', worldError);
      } else {
        console.log('[RESET] ✓ All worlds deleted');
      }

      // Delete all users (this is the critical one that was missing!)
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (userError) {
        console.error('[RESET] Error deleting users:', userError);
      } else {
        console.log('[RESET] ✓ All users deleted');
      }

      console.log('[RESET] ✅ Full database cleanup complete!');
    } catch (error) {
      console.error('[RESET] Error during database cleanup:', error);
      throw error; // Re-throw so caller knows it failed
    }
  }
}

