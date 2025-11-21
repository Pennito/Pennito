import { getFirebaseDatabase, FirebaseHelpers } from './firebase.js';
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

export class MultiplayerSyncFirebase {
  private worldName: string = '';
  private userId: string = '';
  private username: string = '';
  private otherPlayers: Map<string, OtherPlayer> = new Map();
  private onPlayersUpdate: ((players: OtherPlayer[]) => void) | null = null;
  private unsubscribePlayers: (() => void) | null = null;
  private unsubscribeChat: (() => void) | null = null;
  private unsubscribeWorld: (() => void) | null = null;
  
  // Position update batching
  private positionUpdateQueue: { x: number; y: number; playerData: PlayerData; timestamp: number }[] = [];
  private positionUpdateTimer: number | null = null;
  private readonly POSITION_BATCH_INTERVAL = 100; // Batch every 100ms

  // Callbacks
  private chatCallback: ((username: string, text: string) => void) | null = null;
  private worldUpdateCallback: ((worldData: any) => void) | null = null;
  private droppedItemCallback: ((x: number, y: number, tileType: number, gemValue?: number) => void) | null = null;
  private playerJoinCallback: ((userId: string, username: string) => void) | null = null;
  private playerLeaveCallback: ((userId: string, username: string) => void) | null = null;

  constructor(worldName: string, userId: string, username: string) {
    this.worldName = worldName;
    this.userId = userId;
    this.username = username;
  }

  public setPlayersUpdateCallback(callback: (players: OtherPlayer[]) => void): void {
    this.onPlayersUpdate = callback;
  }

  public getOtherPlayers(): OtherPlayer[] {
    return Array.from(this.otherPlayers.values());
  }

  public async initialize(): Promise<void> {
    const db = await getFirebaseDatabase();
    if (!db) {
      console.error('[MULTIPLAYER-FIREBASE] ❌ Firebase not available - multiplayer disabled');
      return;
    }

    console.log('[MULTIPLAYER-FIREBASE] ✓ Firebase connected, initializing multiplayer...');

    // Join the world (create player entry)
    await this.joinWorld();

    // Subscribe to player updates
    this.subscribeToPlayerUpdates();

    // Subscribe to chat
    this.subscribeToChat();

    // Subscribe to world updates
    this.subscribeToWorldUpdates();
    
    console.log('[MULTIPLAYER-FIREBASE] ✓ Multiplayer initialized for world:', this.worldName);
  }

  private async joinWorld(): Promise<void> {
    const playerPath = `worlds/${this.worldName}/players/${this.userId}`;
    await FirebaseHelpers.set(playerPath, {
      username: this.username,
      x: 0,
      y: 0,
      lastSeen: FirebaseHelpers.getServerTimestamp()
    });
    console.log('[MULTIPLAYER-FIREBASE] Joined world:', this.worldName);
  }

  private subscribeToPlayerUpdates(): void {
    const playersPath = `worlds/${this.worldName}/players`;
    
    this.unsubscribePlayers = FirebaseHelpers.on(playersPath, (data: any) => {
      if (!data) {
        this.otherPlayers.clear();
        this.notifyPlayersUpdate();
        return;
      }

      const currentPlayerIds = new Set<string>();
      
      // Update players from Firebase
      Object.keys(data).forEach((userId: string) => {
        if (userId === this.userId) return; // Skip self
        
        const playerData = data[userId];
        currentPlayerIds.add(userId);
        
        // Check if player is still active (seen within last 15 seconds)
        const lastSeen = playerData.lastSeen || Date.now();
        const now = Date.now();
        const timeSinceLastSeen = now - lastSeen;
        
        if (timeSinceLastSeen < 15000) {
          this.otherPlayers.set(userId, {
            userId: userId,
            username: playerData.username || 'Unknown',
            x: playerData.x || 0,
            y: playerData.y || 0,
            equippedHat: playerData.equippedHat,
            equippedShirt: playerData.equippedShirt,
            equippedPants: playerData.equippedPants,
            equippedShoes: playerData.equippedShoes,
            equippedWings: playerData.equippedWings,
            lastUpdate: lastSeen
          });
        } else {
          // Player inactive, remove
          this.otherPlayers.delete(userId);
        }
      });
      
      // Remove players no longer in Firebase
      for (const [userId, player] of this.otherPlayers.entries()) {
        if (!currentPlayerIds.has(userId)) {
          if (this.playerLeaveCallback) {
            this.playerLeaveCallback(userId, player.username);
          }
          this.otherPlayers.delete(userId);
        }
      }
      
      this.notifyPlayersUpdate();
    });
  }

  private subscribeToChat(): void {
    const chatPath = `worlds/${this.worldName}/chat`;
    
    this.unsubscribeChat = FirebaseHelpers.onChildAdded(chatPath, (key: string, message: any) => {
      if (message && message.username && message.text && this.chatCallback) {
        // Only process recent messages (within last minute)
        const messageTime = message.timestamp || 0;
        const now = Date.now();
        if (now - messageTime < 60000) {
          this.chatCallback(message.username, message.text);
        }
      }
    });
  }

  private subscribeToWorldUpdates(): void {
    const worldPath = `worlds/${this.worldName}/blocks`;
    
    this.unsubscribeWorld = FirebaseHelpers.on(worldPath, (data: any) => {
      if (data && this.worldUpdateCallback) {
        this.worldUpdateCallback(data);
      }
    });
  }

  private notifyPlayersUpdate(): void {
    if (this.onPlayersUpdate) {
      const players = Array.from(this.otherPlayers.values());
      this.onPlayersUpdate(players);
    }
  }

  public async broadcastPosition(x: number, y: number, playerData: PlayerData): Promise<void> {
    // Add to queue for batching
    this.positionUpdateQueue.push({ x, y, playerData, timestamp: Date.now() });

    // Schedule batch update
    if (!this.positionUpdateTimer) {
      this.positionUpdateTimer = window.setTimeout(() => {
        this.flushPositionUpdates();
        this.positionUpdateTimer = null;
      }, this.POSITION_BATCH_INTERVAL);
    }
  }

  private async flushPositionUpdates(): Promise<void> {
    if (this.positionUpdateQueue.length === 0) return;

    // Get most recent position
    const latest = this.positionUpdateQueue[this.positionUpdateQueue.length - 1];
    this.positionUpdateQueue = [];

    const playerPath = `worlds/${this.worldName}/players/${this.userId}`;
    await FirebaseHelpers.set(playerPath, {
      username: this.username,
      x: latest.x,
      y: latest.y,
      equippedHat: latest.playerData.equippedHat,
      equippedShirt: latest.playerData.equippedShirt,
      equippedPants: latest.playerData.equippedPants,
      equippedShoes: latest.playerData.equippedShoes,
      equippedWings: latest.playerData.equippedWings,
      lastSeen: FirebaseHelpers.getServerTimestamp()
    });
  }

  public async broadcastChatMessage(username: string, text: string): Promise<void> {
    const chatPath = `worlds/${this.worldName}/chat`;
    await FirebaseHelpers.push(chatPath, {
      username,
      text,
      timestamp: Date.now()
    });
  }

  public setChatCallback(callback: (username: string, text: string) => void): void {
    this.chatCallback = callback;
  }

  public async broadcastWorldUpdate(worldData: any): Promise<void> {
    const blocksPath = `worlds/${this.worldName}/blocks`;
    await FirebaseHelpers.set(blocksPath, {
      data: worldData,
      timestamp: Date.now(),
      updatedBy: this.userId
    });
  }

  public setWorldUpdateCallback(callback: (worldData: any) => void): void {
    this.worldUpdateCallback = callback;
  }

  public async broadcastBlockChange(x: number, y: number, tileType: number, action: 'break' | 'place'): Promise<void> {
    const blockPath = `worlds/${this.worldName}/blockChanges`;
    await FirebaseHelpers.push(blockPath, {
      x,
      y,
      tileType,
      action,
      timestamp: Date.now(),
      userId: this.userId
    });
  }

  public async broadcastDroppedItem(x: number, y: number, tileType: number, gemValue?: number): Promise<void> {
    const itemPath = `worlds/${this.worldName}/droppedItems`;
    await FirebaseHelpers.push(itemPath, {
      x,
      y,
      tileType,
      gemValue,
      timestamp: Date.now()
    });
  }

  public setDroppedItemCallback(callback: (x: number, y: number, tileType: number, gemValue?: number) => void): void {
    this.droppedItemCallback = callback;
    
    // Subscribe to dropped items
    const itemsPath = `worlds/${this.worldName}/droppedItems`;
    FirebaseHelpers.onChildAdded(itemsPath, (key: string, item: any) => {
      if (item && item.x !== undefined && item.y !== undefined) {
        callback(item.x, item.y, item.tileType, item.gemValue);
      }
    });
  }

  public setPlayerJoinCallback(callback: (userId: string, username: string) => void): void {
    this.playerJoinCallback = callback;
  }

  public setPlayerLeaveCallback(callback: (userId: string, username: string) => void): void {
    this.playerLeaveCallback = callback;
  }

  public async leaveWorld(): Promise<void> {
    // Clear position update timer
    if (this.positionUpdateTimer) {
      clearTimeout(this.positionUpdateTimer);
      this.positionUpdateTimer = null;
    }
    
    // Flush pending updates
    if (this.positionUpdateQueue.length > 0) {
      await this.flushPositionUpdates();
    }

    // Unsubscribe from all listeners
    if (this.unsubscribePlayers) {
      this.unsubscribePlayers();
      this.unsubscribePlayers = null;
    }
    if (this.unsubscribeChat) {
      this.unsubscribeChat();
      this.unsubscribeChat = null;
    }
    if (this.unsubscribeWorld) {
      this.unsubscribeWorld();
      this.unsubscribeWorld = null;
    }

    // Remove player from Firebase
    const playerPath = `worlds/${this.worldName}/players/${this.userId}`;
    await FirebaseHelpers.remove(playerPath);

    this.otherPlayers.clear();
    console.log('[MULTIPLAYER-FIREBASE] Left world:', this.worldName);
  }

  public async cleanupDisconnectedPlayers(): Promise<void> {
    // Firebase handles this automatically via real-time listeners
    // But we can manually check for stale players
    const playersPath = `worlds/${this.worldName}/players`;
    const db = await getFirebaseDatabase();
    if (!db) return;

    // This is handled by the real-time listener, no manual cleanup needed
  }
}

