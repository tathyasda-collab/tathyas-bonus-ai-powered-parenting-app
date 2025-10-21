import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../env.js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazily initializes and returns the Supabase client instance.
 * This function ensures the client is created only once, and only when it's first needed.
 * This approach prevents race conditions during the initial script loading where
 * environment variables might not be available yet.
 * @returns {SupabaseClient} The initialized Supabase client.
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = APP_CONFIG.env;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        // This error will now be thrown at runtime when the client is first needed.
        // The main index.tsx validation should catch this first, but this is a safeguard.
        throw new Error("Supabase URL and Anon Key must be provided. Check your env.js file or deployment environment variables.");
    }

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseInstance;
};