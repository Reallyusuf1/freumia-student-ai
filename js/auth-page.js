/*
=========================================
OMNORA STUDENTS AI
AUTHENTICATION PAGE
=========================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    /*
    =========================================
    SUPABASE CLIENT
    =========================================
    */

    const supabase = window.supabaseClient;

    if (!supabase) {
        console.error(
            "Supabase Client not initialized."
        );

        return;
    }


    /*
    =========================================
    OAUTH REFERRAL CODE
    =========================================

    Used ONLY by:
    - Google OAuth
    - X OAuth

    Student Signup has its own
    referral-code system.
    =========================================
    */

    async function getOAuthReferralCode() {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        while (true) {

            let code = "OMR-";

            for (let i = 0; i < 6; i++) {

                code += characters.charAt(
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                );

            }

            const {
                data,
                error
            } = await supabase
                .from("profiles")
                .select("id")
                .eq("referral_code", code)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data) {
                return code;
            }
        }
    }


    /*
    =========================================
    ENSURE OAUTH PROFILE
    =========================================

    Creates a profile ONLY if the
    Google/X user does not already
    have one.
    =========================================
    */

    async function ensureOAuthProfile(user) {

        /*
        -----------------------------------------
        Check existing profile
        -----------------------------------------
        */

        const {
            data: existingProfile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select("id, referral_code")
            .eq("id", user.id)
            .maybeSingle();


        if (profileError) {
            throw profileError;
        }


        /*
        -----------------------------------------
        Existing profile
        -----------------------------------------
        */

        if (existingProfile) {

            console.log(
                "OAuth profile already exists:",
                existingProfile
            );

            return existingProfile;
        }


        /*
        -----------------------------------------
        Generate OAuth referral code
        -----------------------------------------
        */

        const referralCode =
            await getOAuthReferralCode();


        /*
        -----------------------------------------
        OAuth metadata
        -----------------------------------------
        */

        const metadata =
            user.user_metadata || {};


        const fullName =
            metadata.full_name ||
            metadata.name ||
            metadata.user_name ||
            "Student";


        const avatarUrl =
            metadata.avatar_url ||
            metadata.picture ||
            null;


        /*
        -----------------------------------------
        Create profile
        -----------------------------------------
        */

        const {
            data: newProfile,
            error: createError
        } = await supabase
            .from("profiles")
            .insert({

                id: user.id,

                full_name: fullName,

                avatar_url: avatarUrl,

                referral_code: referralCode,

                role: "student"

            })
            .select()
            .single();


        if (createError) {
            throw createError;
        }


        console.log(
            "OAuth profile created:",
            newProfile
        );


        return newProfile;
    }


    /*
    =========================================
    CHECK EXISTING SESSION
    =========================================
    */

    const {
        data: {
            session
        },
        error: sessionError
    } = await supabase.auth.getSession();


    if (sessionError) {

        console.error(
            "SESSION ERROR:",
            sessionError
        );

    }


    console.log(
        "SESSION:",
        session
    );


    /*
    =========================================
    OAUTH USER SESSION
    =========================================
    */

    if (session && session.user) {

        try {

            /*
            -----------------------------------------
            Make sure Google/X user has profile
            -----------------------------------------
            */

            await ensureOAuthProfile(
                session.user
            );


            /*
            -----------------------------------------
            Continue to profile
            -----------------------------------------
            */

            window.location.href =
                "student-profile.html";

            return;

        } catch (error) {

            console.error(
                "OAuth Profile Error:",
                error
            );

            alert(
                "Unable to create your profile. Please try again."
            );

            return;
        }
    }


    /*
    =========================================
    AUTH BUTTONS
    =========================================
    */

    const googleButton =
        document.querySelector(".google-auth");

    const xButton =
        document.querySelector(".x-auth");

    const studentButton =
        document.querySelector(".student-button");


    /*
    =========================================
    GOOGLE AUTHENTICATION
    =========================================
    */

    if (googleButton) {

        googleButton.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                try {

                    const {
                        data,
                        error
                    } =
                        await supabase.auth.signInWithOAuth({

                            provider: "google",

                            options: {

                                redirectTo:
                                    window.location.origin +
                                    "/auth-page.html"

                            }

                        });


                    console.log(
                        "GOOGLE AUTH:",
                        data
                    );


                    if (error) {
                        throw error;
                    }

                } catch (error) {

                    console.error(
                        "Google Authentication Error:",
                        error
                    );

                    alert(
                        error.message
                    );
                }
            }
        );
    }


    /*
    =========================================
    X AUTHENTICATION
    =========================================
    */

    if (xButton) {

        xButton.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                try {

                    const {
                        data,
                        error
                    } =
                        await supabase.auth.signInWithOAuth({

                            provider: "x",

                            options: {

                                redirectTo:
                                    window.location.origin +
                                    "/auth-page.html"

                            }

                        });


                    console.log(
                        "X AUTH:",
                        data
                    );


                    if (error) {
                        throw error;
                    }

                } catch (error) {

                    console.error(
                        "X Authentication Error:",
                        error
                    );

                    alert(
                        error.message
                    );
                }
            }
        );
    }


    /*
    =========================================
    STUDENT REGISTRATION
    =========================================

    This remains completely separate
    from Google/X referral generation.
    =========================================
    */

    if (studentButton) {

        studentButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "student-register.html";

            }
        );
    }

});
