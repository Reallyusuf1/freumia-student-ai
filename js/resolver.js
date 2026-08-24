"use strict";

/**
 * ============================================
 * FREUMIA STUDENTS AI V2
 * Resolver Layer
 * File: js/resolver.js
 * ============================================
 */

/**
 * Resolve FMS-ID to pseudo email.
 */
async function resolveFmsEmail(fmsId) {
    const supabase = window.supabaseClient;

    if (!supabase) {
        throw new Error("Supabase client is not initialized.");
    }

    const { data, error } = await supabase.rpc(
        "resolve_fms_email",
        {
    fms_id_input: fmsId
        }
    );

    if (error) {
        throw error;
    }

    return data;
}

window.OmnoraResolver = {
    resolveFmsEmail
};
