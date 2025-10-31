// Global type declarations
declare global {
  interface Window {
    APP_CONFIG?: {
      env?: {
        SUPABASE_URL?: string;
        SUPABASE_ANON_KEY?: string;
        API_KEY?: string;
      };
    };
  }
}

export {};