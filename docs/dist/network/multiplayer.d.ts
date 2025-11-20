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
export declare class MultiplayerSync {
    private supabase;
    private worldName;
    private userId;
    private username;
    private otherPlayers;
    private positionSyncInterval;
    private realtimeSubscription;
    private onPlayersUpdate;
    constructor(worldName: string, userId: string, username: string);
    setPlayersUpdateCallback(callback: (players: OtherPlayer[]) => void): void;
    initialize(): Promise<void>;
    private joinWorld;
    private subscribeToPlayerUpdates;
    private pollingInterval;
    private startPollingFallback;
    private fetchCurrentPlayers;
    private handlePlayerUpdate;
    private notifyPlayersUpdate;
    private startPositionBroadcast;
    broadcastPosition(x: number, y: number, playerData: PlayerData): Promise<void>;
    private chatChannel;
    private chatCallback;
    private worldChannel;
    private worldUpdateCallback;
    broadcastChatMessage(username: string, text: string): Promise<void>;
    setChatCallback(callback: (username: string, text: string) => void): void;
    private lastWorldBroadcastTime;
    broadcastWorldUpdate(worldData: any): Promise<void>;
    setWorldUpdateCallback(callback: (worldData: any) => void): void;
    broadcastBlockChange(x: number, y: number, tileType: number, action: 'break' | 'place'): Promise<void>;
    broadcastDroppedItem(x: number, y: number, tileType: number, gemValue?: number): Promise<void>;
    private blockChangeCallback;
    private droppedItemCallback;
    setBlockChangeCallback(callback: (x: number, y: number, tileType: number, action: 'break' | 'place') => void): void;
    setDroppedItemCallback(callback: (x: number, y: number, tileType: number, gemValue?: number) => void): void;
    getOtherPlayers(): OtherPlayer[];
    cleanupDisconnectedPlayers(): Promise<void>;
    leaveWorld(): Promise<void>;
}
//# sourceMappingURL=multiplayer.d.ts.map