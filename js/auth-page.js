/*
=========================================
OMNORA STUDENTS AI
AUTHENTICATION PAGE
=========================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    /*
    =========================================
    WAIT FOR SUPABASE CLIENT
    =========================================
    */

    if (!window.supabaseClient) {
        console.error("Supabase Client not initialized.");
        return;
    }

    const supabase = window.supabaseClient;


    /*
    =========================================
    OAUTH PROFILE
    =========================================
    */

    async function ensureOAuthProfile(user) {

        /*
        -----------------------------------------
        Check whether profile already exists
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
        Profile already exists
        -----------------------------------------
        */

        if (existingProfile) {
            console.log(
                "Existing OAuth profile:",
                existingProfile
            );

            return existingProfile;
        }


        /*
        -----------------------------------------
        Generate referral code
        -----------------------------------------

        Reuse the existing referral generator
        from js/auth.js.
        */

        if (
            typeof generateReferralCode !==
            "function"
        ) {
            throw new Error(
                "Referral code generator is not available."
            );
        }

        const referralCode =
            await generateReferralCode();


        /*
        -----------------------------------------
        Get user information from OAuth
        -----------------------------------------
        */

        const metadata =
            user.user_metadata || {};

        const fullName =
            metadata.full_name ||
            metadata.name ||
            metadata.user_name ||
            "";


        const avatarUrl =
            metadata.avatar_url ||
            metadata.picture ||
            null;


        /*
        -----------------------------------------
        Create OAuth profile
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
    CHECK CURRENT SESSION
    =========================================
    */

    const {
        data: { session },
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
    GET CURRENT USER
    =========================================
    */

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();


    console.log(
        "USER:",
        user
    );


    console.log(
        "USER ERROR:",
        userError
    );


    /*
    =========================================
    HANDLE AUTHENTICATED USER
    =========================================
    */

    if (session && session.user) {

        try {

            /*
            -----------------------------------------
            Ensure Google/X user has a profile
            -----------------------------------------
            */

            await ensureOAuthProfile(
                session.user
            );


            /*
            -----------------------------------------
            Continue to student profile
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
    GOOGLE AUTH
    =========================================
    */

    if (googleButton) {

        googleButton.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                try {

                    if (!window.supabaseClient) {

                        alert(
                            "Supabase Client not initialized."
                        );

                        return;
                    }


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
                        "GOOGLE DATA:",
                        data
                    );


                    console.log(
                        "GOOGLE ERROR:",
                        error
                    );


                    if (error) {
                        throw error;
                    }

                } catch (err) {

                    console.error(
                        "Google Authentication Error:",
                        err
                    );

                    alert(
                        err.message
                    );

                }

            }
        );

    }


    /*
    =========================================
    X AUTH
    =========================================
    */

    if (xButton) {

        xButton.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                try {

                    if (!window.supabaseClient) {

                        alert(
                            "Supabase Client not initialized."
                        );

                        return;
                    }


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
                        "X DATA:",
                        data
                    );


                    console.log(
                        "X ERROR:",
                        error
                    );


                    if (error) {
                        throw error;
                    }

                } catch (err) {

                    console.error(
                        "X Authentication Error:",
                        err
                    );

                    alert(
                        err.message
                    );

                }

            }
        );

    }


    /*
    =========================================
    STUDENT REGISTRATION
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
