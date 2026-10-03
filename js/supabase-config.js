const SUPABASE_URL =
    "https://skokulwalbibmqbijvgo.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_yxC0DfTjYBfP5aI_i0FMxw_353ZxV48";


if (
    typeof window.supabase === "undefined"
) {

    console.error(
        "[Spatium] Supabase JS failed to load."
    );

} else {

    window.spatiumSupabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

}
