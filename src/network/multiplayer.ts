import { getSupabaseClient } from './supabase.js';
import { PlayerData } from '../utils/types.js';

export interface OtherPlayer {
  userId: string;
  username: string;
  x: number;
  y: number;
  equippedHat?: number | null;
  equippedShirt?: number | null;
  equippedPants?: number | null;
  equippedShoes?: number | null;
  equippedWings?: number | null;
  lastUpdate: number;
}

export class MultiplayerSync {
  private supabase: any = null;
  private worldName: string = '';
  private userId: string = '';
  private username: string = '';
  private otherPlayers: Map<string, OtherPlayer> = new Map();
  private positionSyncInterval: number | null = null;
  private realtimeSubscription: any = null;
  private onPlayersUpdate: ((players: OtherPlayer[]) => void) | null = null;

  constructor(worldName: string, userId: string, username: string) {
    this.worldName = worldName;
    this.userId = userId;
    this.username = username;
  }

  public setPlayersUpdateCallback(callback: (players: OtherPlayer[]) => void): void {
    this.onPlayersUpdate = callback;
  }

  public async initialize(): Promise<void> {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('[MULTIPLAYER] ❌ Supabase not available - multiplayer disabled');
      return;
    }
    this.supabase = supabase;

    // Check if active_players table exists by trying to query it
    try {
      const { error: testError } = await supabase
        .from('active_players')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('[MULTIPLAYER] ❌ active_players table does not exist or is not accessible!');
        console.error('[MULTIPLAYER] Error:', testError);
        console.error('[MULTIPLAYER] Please run SUPABASE_ACTIVE_PLAYERS_TABLE.sql in your Supabase SQL Editor');
        alert('⚠️ Multiplayer is not set up!\n\nPlease run the SQL script in Supabase to create the active_players table.\n\nSee: SUPABASE_ACTIVE_PLAYERS_TABLE.sql');
        return;
      }
    } catch (error) {
      console.error('[MULTIPLAYER] ❌ Error checking active_players table:', error);
      return;
    }

    console.log('[MULTIPLAYER] ✓ Supabase connected, initializing multiplayer...');

    // Join the world (create/update active player record)
    await this.joinWorld();

    // Subscribe to real-time player updates
    this.subscribeToPlayerUpdates();

    // Start broadcasting position
    this.startPositionBroadcast();
    
    console.log('[MULTIPLAYER] ✓ Multiplayer initialized for world:', this.worldName);
  }

  private async joinWorld(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Upsert player into active_players table
      const { error } = await this.supabase
        .from('active_players')
        .upsert({
          user_id: this.userId,
          username: this.username,
          world_name: this.worldName,
          x: 0,
          y: 0,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[MULTIPLAYER] Error joining world:', error);
      } else {
        console.log('[MULTIPLAYER] Joined world:', this.worldName);
      }
    } catch (error) {
      console.error('[MULTIPLAYER] Error joining world:', error);
    }
  }

  private subscribeToPlayerUpdates(): void {
    if (!this.supabase) return;

    // Subscribe to changes in active_players table for this world
    const channel = this.supabase
      .channel(`world:${this.worldName}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'active_players',
        filter: `world_name=eq.${this.worldName}`
      }, (payload: any) => {
        console.log('[MULTIPLAYER] Received player update:', payload);
        this.handlePlayerUpdate(payload);
      })
      .subscribe((status: string) => {
        console.log('[MULTIPLAYER] Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          // Fetch current players after subscription is ready
          this.fetchCurrentPlayers();
          // Start polling fallback (every 500ms) in case Realtime is slow
          this.startPollingFallback();
        }
      });
    
    this.realtimeSubscription = channel;
  }

  private pollingInterval: number | null = null;

  private startPollingFallback(): void {
    // Poll for player updates every 2 seconds as a fallback if Realtime is slow
    // This ensures we catch players leaving even if Realtime doesn't fire
    // Reduced frequency to avoid overload
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.pollingInterval = window.setInterval(() => {
      this.fetchCurrentPlayers();
    }, 2000); // Poll every 2 seconds instead of 1
  }

  private async fetchCurrentPlayers(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('active_players')
        .select('*')
        .eq('world_name', this.worldName);

      if (error) {
        console.error('[MULTIPLAYER] Error fetching players:', error);
        return;
      }

      if (data) {
        // Get list of current player IDs from database
        const currentPlayerIds = new Set<string>();
        
        // Update or add players from database
        data.forEach((player: any) => {
          if (player.user_id !== this.userId) {
            currentPlayerIds.add(player.user_id);
            
            // Check if player's last_seen is recent (within last 15 seconds) - more lenient
            const lastSeen = player.last_seen ? new Date(player.last_seen).getTime() : Date.now();
            const now = Date.now();
            const timeSinceLastSeen = now - lastSeen;
            
            // Only add/update if player was seen recently (within 15 seconds)
            if (timeSinceLastSeen < 15000) {
              // Use the actual last_seen timestamp, not current time, to prevent premature removal
              this.otherPlayers.set(player.user_id, {
                userId: player.user_id,
                username: player.username,
                x: player.x || 0,
                y: player.y || 0,
                equippedHat: player.equipped_hat,
                equippedShirt: player.equipped_shirt,
                equippedPants: player.equipped_pants,
                equippedShoes: player.equipped_shoes,
                equippedWings: player.equipped_wings,
                lastUpdate: lastSeen // Use actual last_seen timestamp from database
              });
            } else {
              // Player hasn't been seen recently, remove them
              console.log(`[MULTIPLAYER] 🚪 Removing ${player.username} (last_seen too old: ${timeSinceLastSeen}ms)`);
              this.otherPlayers.delete(player.user_id);
            }
          }
        });
        
        // Remove players that are no longer in the database
        for (const [userId, player] of this.otherPlayers.entries()) {
          if (!currentPlayerIds.has(userId)) {
            console.log(`[MULTIPLAYER] 🚪 Removing ${player.username} (not in database)`);
            this.otherPlayers.delete(userId);
          }
        }
        
        this.notifyPlayersUpdate();
      } else {
        // No players in database, clear all
        if (this.otherPlayers.size > 0) {
          console.log('[MULTIPLAYER] 🚪 No players in database, clearing all');
          this.otherPlayers.clear();
          this.notifyPlayersUpdate();
        }
      }
    } catch (error) {
      console.error('[MULTIPLAYER] Error fetching players:', error);
    }
  }

  private handlePlayerUpdate(payload: any): void {
    const { eventType, new: newData, old: oldData } = payload;

    if (eventType === 'DELETE') {
      // Player left
      if (oldData && oldData.user_id !== this.userId) {
        console.log(`[MULTIPLAYER] 🚪 Player ${oldData.username} left (DELETE event)`);
        this.otherPlayers.delete(oldData.user_id);
        this.notifyPlayersUpdate();
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Player joined or updated
      if (newData && newData.user_id !== this.userId) {
        // Use last_seen timestamp if available, otherwise use current time
        const lastSeen = newData.last_seen ? new Date(newData.last_seen).getTime() : Date.now();
        
        this.otherPlayers.set(newData.user_id, {
          userId: newData.user_id,
          username: newData.username,
          x: newData.x || 0,
          y: newData.y || 0,
          equippedHat: newData.equipped_hat,
          equippedShirt: newData.equipped_shirt,
          equippedPants: newData.equipped_pants,
          equippedShoes: newData.equipped_shoes,
          equippedWings: newData.equipped_wings,
          lastUpdate: lastSeen // Use actual last_seen from database
        });
        this.notifyPlayersUpdate();
      }
    }
  }

  private notifyPlayersUpdate(): void {
    if (this.onPlayersUpdate) {
      const players = Array.from(this.otherPlayers.values());
      this.onPlayersUpdate(players);
    }
  }

  private startPositionBroadcast(): void {
    // Position will be broadcasted manually from game loop
    // This method is kept for compatibility but doesn't start an interval
  }

  public async broadcastPosition(x: number, y: number, playerData: PlayerData): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from('active_players')
        .upsert({
          user_id: this.userId,
          username: this.username,
          world_name: this.worldName,
          x: x,
          y: y,
          equipped_hat: playerData.equippedHat,
          equipped_shirt: playerData.equippedShirt,
          equipped_pants: playerData.equippedPants,
          equipped_shoes: playerData.equippedShoes,
          equipped_wings: playerData.equippedWings,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[MULTIPLAYER] Error broadcasting position:', error);
      }
    } catch (error) {
      console.error('[MULTIPLAYER] Error broadcasting position:', error);
    }
  }

  private chatChannel: any = null;
  private chatCallback: ((username: string, text: string) => void) | null = null;
  private worldChannel: any = null;
  private worldUpdateCallback: ((worldData: any) => void) | null = null;

  public async broadcastChatMessage(username: string, text: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Use Realtime broadcast for chat messages
      if (!this.chatChannel) {
        this.chatChannel = this.supabase.channel(`world-chat:${this.worldName}`);
        await this.chatChannel.subscribe();
      }
      
      await this.chatChannel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: { username, text, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('[MULTIPLAYER] Error broadcasting chat:', error);
    }
  }

  public setChatCallback(callback: (username: string, text: string) => void): void {
    if (!this.supabase) return;
    
    this.chatCallback = callback;

    if (!this.chatChannel) {
      this.chatChannel = this.supabase.channel(`world-chat:${this.worldName}`);
    }
    
    this.chatChannel.on('broadcast', { event: 'chat_message' }, (payload: any) => {
      if (payload.payload && payload.payload.username && payload.payload.text && this.chatCallback) {
        this.chatCallback(payload.payload.username, payload.payload.text);
      }
    });
    
    this.chatChannel.subscribe();
  }

  private lastWorldBroadcastTime: number = 0;

  public async broadcastWorldUpdate(worldData: any): Promise<void> {
    if (!this.supabase) return;

    try {
      if (!this.worldChannel) {
        this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
        
        // Set up listener first
        this.worldChannel.on('broadcast', { event: 'world_update' }, (payload: any) => {
          if (payload.payload && payload.payload.worldData && this.worldUpdateCallback) {
            // Don't process our own updates (check userId)
            if (payload.payload.userId === this.userId) {
              return; // This is our own update
            }
            console.log('[WORLD-SYNC] 📥 Received world update from player:', payload.payload.userId);
            this.worldUpdateCallback(payload.payload.worldData);
          }
        });
        
        await this.worldChannel.subscribe();
        console.log('[WORLD-SYNC] ✅ Subscribed to world updates channel');
      }
      
      const now = Date.now();
      // Throttle broadcasts to once per 500ms
      if (now - this.lastWorldBroadcastTime < 500) {
        return;
      }
      this.lastWorldBroadcastTime = now;
      
      await this.worldChannel.send({
        type: 'broadcast',
        event: 'world_update',
        payload: { worldData, timestamp: now, userId: this.userId }
      });
      console.log('[WORLD-SYNC] 📤 Broadcasted world update');
    } catch (error) {
      console.error('[MULTIPLAYER] ❌ Error broadcasting world update:', error);
    }
  }

  public setWorldUpdateCallback(callback: (worldData: any) => void): void {
    if (!this.supabase) return;
    
    this.worldUpdateCallback = callback;

    if (!this.worldChannel) {
      this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
    }
    
    // Listener is set up in broadcastWorldUpdate to avoid duplicates
    // Just subscribe if not already subscribed
    this.worldChannel.subscribe();
  }

  // Broadcast instant block change (for breaking/placing blocks)
  public async broadcastBlockChange(x: number, y: number, tileType: number, action: 'break' | 'place'): Promise<void> {
    if (!this.supabase) return;

    try {
      if (!this.worldChannel) {
        this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
        await this.worldChannel.subscribe();
      }
      
      await this.worldChannel.send({
        type: 'broadcast',
        event: 'block_change',
        payload: { x, y, tileType, action, userId: this.userId, timestamp: Date.now() }
      });
      console.log(`[BLOCK-SYNC] 📤 Broadcasted ${action} at (${x}, ${y})`);
    } catch (error) {
      console.error('[MULTIPLAYER] ❌ Error broadcasting block change:', error);
    }
  }

  // Broadcast dropped item creation
  public async broadcastDroppedItem(x: number, y: number, tileType: number, gemValue?: number): Promise<void> {
    if (!this.supabase) return;

    try {
      if (!this.worldChannel) {
        this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
        await this.worldChannel.subscribe();
      }
      
      await this.worldChannel.send({
        type: 'broadcast',
        event: 'dropped_item',
        payload: { x, y, tileType, gemValue, userId: this.userId, timestamp: Date.now() }
      });
      console.log(`[ITEM-SYNC] 📤 Broadcasted dropped item at (${x}, ${y})`);
    } catch (error) {
      console.error('[MULTIPLAYER] ❌ Error broadcasting dropped item:', error);
    }
  }

  // Set callbacks for block changes and dropped items
  private blockChangeCallback: ((x: number, y: number, tileType: number, action: 'break' | 'place') => void) | null = null;
  private droppedItemCallback: ((x: number, y: number, tileType: number, gemValue?: number) => void) | null = null;

  public setBlockChangeCallback(callback: (x: number, y: number, tileType: number, action: 'break' | 'place') => void): void {
    this.blockChangeCallback = callback;
    
    if (!this.worldChannel) {
      this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
    }
    
    this.worldChannel.on('broadcast', { event: 'block_change' }, (payload: any) => {
      if (payload.payload && payload.payload.userId !== this.userId && this.blockChangeCallback) {
        this.blockChangeCallback(
          payload.payload.x,
          payload.payload.y,
          payload.payload.tileType,
          payload.payload.action
        );
      }
    });
    
    this.worldChannel.subscribe();
  }

  public setDroppedItemCallback(callback: (x: number, y: number, tileType: number, gemValue?: number) => void): void {
    this.droppedItemCallback = callback;
    
    if (!this.worldChannel) {
      this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
    }
    
    this.worldChannel.on('broadcast', { event: 'dropped_item' }, (payload: any) => {
      if (payload.payload && payload.payload.userId !== this.userId && this.droppedItemCallback) {
        this.droppedItemCallback(
          payload.payload.x,
          payload.payload.y,
          payload.payload.tileType,
          payload.payload.gemValue
        );
      }
    });
    
    this.worldChannel.subscribe();
  }

  public getOtherPlayers(): OtherPlayer[] {
    // Remove players that haven't updated in 10 seconds (disconnected) - more lenient
    const now = Date.now();
    const timeout = 10000; // Increased to 10s to prevent premature removal
    
    let removedAny = false;
    for (const [userId, player] of this.otherPlayers.entries()) {
      if (now - player.lastUpdate > timeout) {
        console.log(`[MULTIPLAYER] 🚪 Player ${player.username} left (timeout: ${now - player.lastUpdate}ms)`);
        this.otherPlayers.delete(userId);
        removedAny = true;
      }
    }
    
    if (removedAny) {
      this.notifyPlayersUpdate();
    }

    return Array.from(this.otherPlayers.values());
  }
  
  // Periodically check for disconnected players in active_players table
  public async cleanupDisconnectedPlayers(): Promise<void> {
    if (!this.supabase) return;
    
    try {
      // Delete players that haven't been seen in 5 seconds (more aggressive cleanup)
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const { error } = await this.supabase
        .from('active_players')
        .delete()
        .lt('last_seen', fiveSecondsAgo)
        .neq('user_id', this.userId); // Don't delete ourselves
      
      if (error) {
        console.error('[MULTIPLAYER] Error cleaning up disconnected players:', error);
      } else {
        // After cleanup, refresh our local player list
        this.fetchCurrentPlayers();
      }
    } catch (error) {
      console.error('[MULTIPLAYER] Error cleaning up disconnected players:', error);
    }
  }

  public async leaveWorld(): Promise<void> {
    // Stop broadcasting
    if (this.positionSyncInterval) {
      clearInterval(this.positionSyncInterval);
      this.positionSyncInterval = null;
    }
    
    // Stop polling fallback
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    // Unsubscribe from realtime
    if (this.realtimeSubscription) {
      await this.supabase?.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }

    // Remove player from active_players
    if (this.supabase) {
      try {
        await this.supabase
          .from('active_players')
          .delete()
          .eq('user_id', this.userId);
      } catch (error) {
        console.error('[MULTIPLAYER] Error leaving world:', error);
      }
    }

    this.otherPlayers.clear();
  }
}

