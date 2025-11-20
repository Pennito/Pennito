export type SupabaseClient = any;
export declare function getSupabaseClient(): Promise<SupabaseClient | null>;
export declare function initializeSupabase(url: string, anonKey: string): Promise<void>;
export interface DatabaseUser {
    id: string;
    username: string;
    password: string;
    last_world?: string;
    created_at: string;
}
export interface DatabaseWorld {
    id: string;
    name: string;
    data: any;
    created_at: string;
    updated_at: string;
}
export interface DatabaseInventory {
    id: string;
    user_id: string;
    items: any;
    updated_at: string;
}
//# sourceMappingURL=supabase.d.ts.map