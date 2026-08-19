/*
=========================================
OMNORA STUDENTS AI
AUTHENTICATION PAGE
=========================================
*/

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
        =========================================
        SUPABASE CLIENT
        =========================================
        */

        const supabase =
            window.supabaseClient;


        if (!supabase) {

            console.error(
                "Supabase Client not initialized."
            );

            return;
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
        } =
            await supabase.auth.getSession();


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

        Profile and referral-code creation
        are handled by auth.js.
        =========================================
        */

        if (
            session &&
            session.user
        ) {

            try {

                /*
                -----------------------------------------
                Make sure Google/X user has a profile
                -----------------------------------------

                auth.js handles:
                - profile lookup
                - referral code
                - profile creation
                */

                if (
                    !window.OmnoraAuth ||
                    typeof
                    window.OmnoraAuth
                        .ensureOAuthProfile !==
                    "function"
                ) {

                    throw new Error(
                        "Authentication service is not available."
                    );

                }


                await window.OmnoraAuth
                    .ensureOAuthProfile(
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
            document.querySelector(
                ".google-auth"
            );


        const xButton =
            document.querySelector(
                ".x-auth"
            );


        const studentButton =
            document.querySelector(
                ".student-button"
            );


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
                            await supabase
                                .auth
                                .signInWithOAuth({

                                    provider:
                                        "google",

                                    options: {

                                        redirectTo:
                                            window
                                                .location
                                                .origin +
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
                            await supabase
                                .auth
                                .signInWithOAuth({

                                    provider:
                                        "x",

                                    options: {

                                        redirectTo:
                                            window
                                                .location
                                                .origin +
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

    }
);
