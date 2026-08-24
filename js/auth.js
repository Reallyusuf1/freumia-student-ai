/**
 * =====================================================
 * OMNORA STUDENTS AI V2
 * Authentication Core
 * File: js/auth.js
 * =====================================================
 */

"use strict";

/**
 * Return initialized Supabase client.
 */
function getSupabase() {
    if (!window.supabaseClient) {
        throw new Error("Supabase client is not initialized.");
    }

    return window.supabaseClient;
}

/**
 * Get current authenticated user.
 */
async function getCurrentUser() {
    const supabase = getSupabase();

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return user;
}

/**
 * Get current session.
 */
async function getCurrentSession() {
    const supabase = getSupabase();

    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error(error);
        return null;
    }

    return session;
}

/**
 * Check whether user is authenticated.
 */
async function isAuthenticated() {
    const session = await getCurrentSession();

    return !!session;
}

/**
 * Protect private pages.
 */
async function requireAuth() {

    const loggedIn = await isAuthenticated();

    if (!loggedIn) {

        window.location.href =
            "student-login.html";

        return false;
    }

    return true;
}

/**
 * Logout current student.
 */
async function logoutStudent() {

    const supabase = getSupabase();

    const { error } =
        await supabase.auth.signOut();

    if (error) {

        console.error(error);

        return false;
    }

    window.location.href =
        "student-login.html";

    return true;
}


/**
 * =====================================================
 * OAuth Profile / Referral
 * Google and X only.
 *
 * Student Signup keeps its existing referral flow.
 * =====================================================
 */


/**
 * Find an OAuth user's profile.
 *
 * maybeSingle() is important because a new OAuth user
 * may not have a profile yet.
 */
async function getOAuthProfile(userId) {

    if (!userId) {
        throw new Error("User ID is required.");
    }

    const supabase = getSupabase();

    const { data, error } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}


/**
 * Get an existing OAuth referral code.
 *
 * If the profile exists without a referral code,
 * generate one and save it.
 *
 * Student Signup is NOT affected.
 */
async function getReferralCode(userId) {

    if (!userId) {
        throw new Error("User ID is required.");
    }

    const profile =
        await getOAuthProfile(userId);

    /**
     * Existing referral code:
     * return it without changing it.
     */
    if (profile?.referral_code) {
        return profile.referral_code;
    }

    /**
     * Generate a new unique referral code.
     */
    const referralCode =
        await generateReferralCode();

    /**
     * If the profile does not exist yet,
     * the caller will use this code when
     * creating the profile.
     */
    if (!profile) {
        return referralCode;
    }

    /**
     * Existing profile without referral code.
     */
    const supabase = getSupabase();

    const { error } =
        await supabase
            .from("profiles")
            .update({
                referral_code: referralCode
            })
            .eq("id", userId);

    if (error) {
        throw error;
    }

    return referralCode;
}


/**
 * Ensure that a Google/X user has a profile
 * and a referral code.
 *
 * This is completely separate from registerStudent().
 */
async function ensureOAuthProfile(user) {

    if (!user?.id) {
        throw new Error(
            "Authenticated user is required."
        );
    }

    /**
     * Check whether profile already exists.
     */
    const existingProfile =
        await getOAuthProfile(user.id);

    /**
     * Existing OAuth profile.
     *
     * Do not create another profile.
     */
    if (existingProfile) {

        const referralCode =
            await getReferralCode(user.id);

        return {
            profile: {
                ...existingProfile,
                referral_code: referralCode
            },

            referral_code: referralCode,

            created: false
        };
    }


    /**
     * New OAuth user.
     */
    const supabase = getSupabase();

    const metadata =
        user.user_metadata || {};


    /**
     * Get name from Google/X metadata.
     */
    const fullName =
        metadata.full_name ||
        metadata.name ||
        metadata.user_name ||
        metadata.preferred_username ||
        "Student";


    /**
     * Get avatar if provider supplied one.
     */
    const avatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        null;


    /**
     * Generate unique referral code.
     */
    const referralCode =
        await generateReferralCode();


    /**
     * Create OAuth profile.
     *
     * IMPORTANT:
     *
     * We intentionally do NOT use:
     *
     * oms_id
     * school_name
     * admission_number
     * class_level
     * password
     *
     * Those belong to Student Signup.
     */
    const {
        data: profile,
        error
    } = await supabase
        .from("profiles")
        .insert({

            id: user.id,

            full_name: fullName,

            avatar_url: avatarUrl,

            referral_code: referralCode,

            role: "student"

        })
        .select("*")
        .single();


    if (error) {
        throw error;
    }


    /**
     * Process referral link if this OAuth
     * user came through somebody's referral.
     *
     * Referral failure must not break login.
     */
    try {

        await processReferral(user.id);

    } catch (error) {

        console.error(
            "OAuth Referral Processing:",
            error
        );
    }


    return {

        profile,

        referral_code: referralCode,

        created: true

    };
}


/**
 * =====================================================
 * Global Auth API
 * =====================================================
 */

window.OmnoraAuth = {

    getCurrentUser,

    getCurrentSession,

    isAuthenticated,

    requireAuth,

    registerStudent,

    loginStudent,

    getOAuthProfile,

    getReferralCode,

    ensureOAuthProfile,

    logoutStudent

};


/**
 * =====================================================
 * Create Student Profile
 * =====================================================
 */

async function createStudentProfile(
    userId,
    profile
) {

    const supabase = getSupabase();

    const { error } =
        await supabase
            .from("profiles")
            .insert({

                id: userId,

                fms_id: profile.fms_id,

                full_name: profile.full_name,

                school_name: profile.school_name,

                country: profile.country,

                admission_number:
                    profile.admission_number || null,

                class_level:
                    profile.class_level || null,

                gender:
                    profile.gender || null,

                state:
                    profile.state || null,

                city:
                    profile.city || null,

                date_of_birth:
                    profile.date_of_birth || null,

                goal:
                    profile.goal || null,

                avatar_url:
                    profile.avatar_url || null,

                referral_code:
                    profile.referral_code,

                role: "student"

            });


    if (error) {
        throw error;
    }
}


/**
 * =====================================================
 * Generate Unique Referral Code
 * =====================================================
 */

async function generateReferralCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    while (true) {

        let code = "FRM-";


        for (let i = 0; i < 6; i++) {

            code += characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );

        }


        const supabase = getSupabase();


        const { data, error } =
            await supabase
                .from("profiles")
                .select("id")
                .eq(
                    "referral_code",
                    code
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {
            return code;
        }

    }

}


/**
 * =====================================================
 * Process Referral
 * =====================================================
 */

async function processReferral(
    invitedProfileId
) {

    const referralCode =
        sessionStorage.getItem(
            "freumia_referral"
        );


    if (!referralCode) {
        return;
    }


    const supabase = getSupabase();


    const { error } =
        await supabase.rpc(
            "process_student_referral",
            {

                p_referral_code:
                    referralCode,

                p_invited_profile_id:
                    invitedProfileId

            }
        );


    if (error) {
        throw error;
    }


    sessionStorage.removeItem(
        "freumia_referral"
    );
}


/**
 * =====================================================
 * Register Student
 * =====================================================
 *
 * IMPORTANT:
 * This is the original Student Signup flow.
 * OAuth referral logic does NOT replace it.
 */

async function registerStudent(formData) {

    const supabase = getSupabase();


    /**
     * Required Student Signup fields.
     */
    if (
        !formData.full_name ||
        !formData.school_name ||
        !formData.country ||
        !formData.password
    ) {

        throw new Error(
            "Please complete all required fields."
        );
    }


    /**
     * Generate FM-ID.
     */
    const {
        data: fmsId,
        error: fmsError
    } = await supabase.rpc(
        "generate_fms_id"
    );


    if (fmsError) {
        throw fmsError;
    }


    /**
     * Create pseudo email.
     */
    const pseudoEmail =
        `${fmsId.toLowerCase()}@students.freumia.ai`;


    /**
     * Create Supabase Auth account.
     */
    const {
        data,
        error
    } = await supabase.auth.signUp({

        email: pseudoEmail,

        password: formData.password

    });


    if (error) {
        throw error;
    }


    if (!data?.user) {

        throw new Error(
            "Student account was not created."
        );

    }


    /**
     * Student Signup referral code.
     *
     * THIS REMAINS SEPARATE FROM GOOGLE/X.
     */
    const referralCode =
        await generateReferralCode();


    /**
     * Create Student profile.
     */
    await createStudentProfile(

        data.user.id,

        {

            ...formData,

            fms_id: fmsId,

            referral_code: referralCode

        }

    );


    /**
     * Process referral.
     */
    try {

        await processReferral(
            data.user.id
        );

    } catch (error) {

        console.error(
            "Referral Processing:",
            error
        );

    }


    return {

        success: true,

        fms_id: fmsId

    };

}


/**
 * =====================================================
 * Login Student
 * =====================================================
 */

async function loginStudent(loginData) {

    const supabase = getSupabase();


    console.log(
        "FMS-ID RECEIVED:",
        loginData.fmsId
    );


    try {

        const pseudoEmail =
            await OmnoraResolver.resolveFmsEmail(
                loginData.fmsId
            );


        console.log(
            "Resolved Email:",
            pseudoEmail
        );


        const {
            data,
            error
        } = await supabase.auth.signInWithPassword({

            email: pseudoEmail,

            password: loginData.password

        });


        console.log(
            "AUTH DATA:",
            data
        );

        console.log(
            "AUTH ERROR:",
            error
        );


        if (error) {

            return {

                success: false,

                message:
                    "Invalid FMS-ID or password."

            };

        }


        return {

            success: true

        };


    } catch (e) {

        console.error(
            "LOGIN EXCEPTION:",
            e
        );

        throw e;
    }

}
