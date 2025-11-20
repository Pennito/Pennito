import { getSupabaseClient } from './supabase.js';
export class MultiplayerSync {
    constructor(worldName, userId, username) {
        this.supabase = null;
        this.worldName = '';
        this.userId = '';
        this.username = '';
        this.otherPlayers = new Map();
        this.positionSyncInterval = null;
        this.realtimeSubscription = null;
        this.onPlayersUpdate = null;
        this.chatChannel = null;
        this.chatCallback = null;
        this.worldChannel = null;
        this.worldUpdateCallback = null;
        this.lastWorldBroadcastTime = 0;
        this.worldName = worldName;
        this.userId = userId;
        this.username = username;
    }
    setPlayersUpdateCallback(callback) {
        this.onPlayersUpdate = callback;
    }
    async initialize() {
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
        }
        catch (error) {
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
    async joinWorld() {
        if (!this.supabase)
            return;
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
            }
            else {
                console.log('[MULTIPLAYER] Joined world:', this.worldName);
            }
        }
        catch (error) {
            console.error('[MULTIPLAYER] Error joining world:', error);
        }
    }
    subscribeToPlayerUpdates() {
        if (!this.supabase)
            return;
        // Subscribe to changes in active_players table for this world
        const channel = this.supabase
            .channel(`world:${this.worldName}`)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'active_players',
            filter: `world_name=eq.${this.worldName}`
        }, (payload) => {
            console.log('[MULTIPLAYER] Received player update:', payload);
            this.handlePlayerUpdate(payload);
        })
            .subscribe((status) => {
            console.log('[MULTIPLAYER] Realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
                // Fetch current players after subscription is ready
                this.fetchCurrentPlayers();
            }
        });
        this.realtimeSubscription = channel;
    }
    async fetchCurrentPlayers() {
        if (!this.supabase)
            return;
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
                data.forEach((player) => {
                    if (player.user_id !== this.userId) {
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
                            lastUpdate: Date.now()
                        });
                    }
                });
                this.notifyPlayersUpdate();
            }
        }
        catch (error) {
            console.error('[MULTIPLAYER] Error fetching players:', error);
        }
    }
    handlePlayerUpdate(payload) {
        const { eventType, new: newData, old: oldData } = payload;
        if (eventType === 'DELETE') {
            // Player left
            if (oldData && oldData.user_id !== this.userId) {
                this.otherPlayers.delete(oldData.user_id);
                this.notifyPlayersUpdate();
            }
        }
        else if (eventType === 'INSERT' || eventType === 'UPDATE') {
            // Player joined or updated
            if (newData && newData.user_id !== this.userId) {
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
                    lastUpdate: Date.now()
                });
                this.notifyPlayersUpdate();
            }
        }
    }
    notifyPlayersUpdate() {
        if (this.onPlayersUpdate) {
            const players = Array.from(this.otherPlayers.values());
            this.onPlayersUpdate(players);
        }
    }
    startPositionBroadcast() {
        // Position will be broadcasted manually from game loop
        // This method is kept for compatibility but doesn't start an interval
    }
    async broadcastPosition(x, y, playerData) {
        if (!this.supabase)
            return;
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
        }
        catch (error) {
            console.error('[MULTIPLAYER] Error broadcasting position:', error);
        }
    }
    async broadcastChatMessage(username, text) {
        if (!this.supabase)
            return;
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
        }
        catch (error) {
            console.error('[MULTIPLAYER] Error broadcasting chat:', error);
        }
    }
    setChatCallback(callback) {
        if (!this.supabase)
            return;
        this.chatCallback = callback;
        if (!this.chatChannel) {
            this.chatChannel = this.supabase.channel(`world-chat:${this.worldName}`);
        }
        this.chatChannel.on('broadcast', { event: 'chat_message' }, (payload) => {
            if (payload.payload && payload.payload.username && payload.payload.text && this.chatCallback) {
                this.chatCallback(payload.payload.username, payload.payload.text);
            }
        });
        this.chatChannel.subscribe();
    }
    async broadcastWorldUpdate(worldData) {
        if (!this.supabase)
            return;
        try {
            if (!this.worldChannel) {
                this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
                // Set up listener first
                this.worldChannel.on('broadcast', { event: 'world_update' }, (payload) => {
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
        }
        catch (error) {
            console.error('[MULTIPLAYER] ❌ Error broadcasting world update:', error);
        }
    }
    setWorldUpdateCallback(callback) {
        if (!this.supabase)
            return;
        this.worldUpdateCallback = callback;
        if (!this.worldChannel) {
            this.worldChannel = this.supabase.channel(`world-updates:${this.worldName}`);
        }
        // Listener is set up in broadcastWorldUpdate to avoid duplicates
        // Just subscribe if not already subscribed
        this.worldChannel.subscribe();
    }
    getOtherPlayers() {
        // Remove players that haven't updated in 5 seconds (disconnected)
        const now = Date.now();
        const timeout = 5000;
        for (const [userId, player] of this.otherPlayers.entries()) {
            if (now - player.lastUpdate > timeout) {
                this.otherPlayers.delete(userId);
            }
        }
        return Array.from(this.otherPlayers.values());
    }
    async leaveWorld() {
        // Stop broadcasting
        if (this.positionSyncInterval) {
            clearInterval(this.positionSyncInterval);
            this.positionSyncInterval = null;
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
            }
            catch (error) {
                console.error('[MULTIPLAYER] Error leaving world:', error);
            }
        }
        this.otherPlayers.clear();
    }
}
//# sourceMappingURL=multiplayer.js.map