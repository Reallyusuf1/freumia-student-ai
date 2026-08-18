/*
=========================================
OMNORA STUDENTS AI
AUTHENTICATION PAGE
=========================================
*/

document.addEventListener("DOMContentLoaded", async () => {
    if (window.supabaseClient) {

    const {
        data: { session },
        error
    } = await window.supabaseClient.auth.getSession();

    if (error) {
        console.error(error);
    }
        console.log("SESSION:", session);
console.log("SESSION ERROR:", error);

const {
    data: { user },
    error: userError,
} = await window.supabaseClient.auth.getUser();

console.log("USER:", user);
console.log("USER ERROR:", userError);

    if (session && session.user) {
        window.location.href = "student-profile.html";
        return;
    }
    }

    const googleButton = document.querySelector(".google-auth");
    const xButton = document.querySelector(".x-auth");
    const studentButton = document.querySelector(".student-button");

    /*
    =========================================
    GOOGLE AUTH
    =========================================
    */

    if (googleButton) {

        googleButton.addEventListener("click", async (event) => {

            event.preventDefault();

            try {

                if (!window.supabaseClient) {
                    alert("Supabase Client not initialized.");
                    return;
                }

                const { data, error } =
                    await window.supabaseClient.auth.signInWithOAuth({

                        provider: "google",

                        options: {
                            redirectTo:
                                window.location.origin + "/auth-page.html"
                        }

                    });

                console.log("DATA:", data);
                console.log("ERROR:", error);

                if (error) {
                    throw error;
                }

            } catch (err) {

                console.error(err);
                alert(err.message);

            }

        });

    }

    /*
    =========================================
    X AUTH
    =========================================
    */

    if (xButton) {

        xButton.addEventListener("click", async (event) => {

            event.preventDefault();

            try {

                if (!window.supabaseClient) {
                    alert("Supabase Client not initialized.");
                    return;
                }

                const { error } =
                    await window.supabaseClient.auth.signInWithOAuth({

                        provider: "x",

                        options: {
                            redirectTo:
                                window.location.origin + "/auth-page.html"
                        }

                    });

                if (error) {
                    throw error;
                }

            } catch (err) {

                console.error(err);
                alert(err.message);

            }

        });

    }

    /*
    =========================================
    STUDENT REGISTRATION
    =========================================
    */

    if (studentButton) {

        studentButton.addEventListener("click", () => {

            window.location.href = "student-register.html";

        });

    }

});
