import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'hopepms-auth',
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        // ✅ Bypasses the Web Locks API that causes "Session lock timeout"
        // This is what's causing the PENDING state on refresh/alt-tab
        lock: async (_name, _acquireTimeout, fn) => {
            return await fn();
        },
    },
});