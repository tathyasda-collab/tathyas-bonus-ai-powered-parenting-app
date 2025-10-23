// services/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('supabaseClient: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

// Create the Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL ?? '', SUPABASE_KEY ?? '');

// DEBUG: expose for quick manual testing in console (temporary)
if (typeof window !== 'undefined') {
  // Attach a short helper to window for debugging (remove in production if you prefer)
  (window as any).__SUPABASE__ = supabase;

  // Print a simple presence check (true/false), not secrets.
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('DEBUG: supabaseClient session present?', !!session);
  }).catch(err => {
    console.log('DEBUG: supabaseClient getSession error (non-fatal)', err?.message ?? err);
  });
}
