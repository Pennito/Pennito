// Supabase configuration - CONFIGURED ✅
// Project: sandbox-game
const SUPABASE_URL = 'https://sejqgdpefimbuychbkug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlanFnZHBlZmltYnV5Y2hia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTkzNTMsImV4cCI6MjA3ODUzNTM1M30.7bQeaqhQGU14x8BsW18o9QZDOxOhlJZ89Kfp2tsH9hs';
let supabaseClient = null;
let supabaseModule = null;
// Lazy load Supabase from CDN
async function loadSupabase() {
    if (supabaseModule)
        return supabaseModule;
    try {
        // Try to load from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.async = true;
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        // @ts-ignore - Supabase is loaded globally
        if (window.supabase) {
            supabaseModule = window.supabase;
            return supabaseModule;
        }
    }
    catch (error) {
        console.warn('Could not load Supabase from CDN:', error);
    }
    return null;
}
export async function getSupabaseClient() {
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_')) {
            console.warn('Supabase not configured. Using localStorage fallback.');
            return null;
        }
        if (!supabaseClient) {
            const module = await loadSupabase();
            if (!module || !module.createClient) {
                console.warn('Supabase module not available. Using localStorage fallback.');
                return null;
            }
            supabaseClient = module.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return supabaseClient;
    }
    catch (error) {
        console.error('Error initializing Supabase:', error);
        return null;
    }
}
export async function initializeSupabase(url, anonKey) {
    const module = await loadSupabase();
    if (module && module.createClient) {
        supabaseClient = module.createClient(url, anonKey);
    }
}
//# sourceMappingURL=supabase.js.map