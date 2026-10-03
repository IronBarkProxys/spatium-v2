const SUPABASE_URL = "https://skokulwalbibmqbijvgo.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_yxC0DfTjYBfP5aI_i0FMxw_353ZxV48";

if (!window.supabase) {
    console.error("[Qz Games] Supabase JS failed to load.");
} else {
    window.qzSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
}
