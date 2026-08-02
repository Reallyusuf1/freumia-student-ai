/**
 * =====================================================
 * OMNORA STUDENTS AI V2
 * Supabase Client Initialization
 * =====================================================
 */

const SUPABASE_URL =
    "https://qnheojayfgtdohmezxju.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_xds1jJt0bjywElP-9tN_sg_TUBC6zgT";

// Ensure Supabase SDK is loaded
if (!window.supabase) {
    console.error("Supabase SDK failed to load.");
} else {

    try {

        window.supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

        console.log("✅ Supabase Client Ready");

    } catch (error) {

        console.error(
            "Failed to initialize Supabase:",
            error
        );

    }

}

/**
 * Returns true if Supabase Client is available.
 */
window.isSupabaseReady = function () {
    return !!window.supabaseClient;
};
