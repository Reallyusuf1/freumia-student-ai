/**
 * ============================================================
 * Omnora Student AI V2
 * File: js/quizzes.js
 * Purpose: Quiz Initialization & Session Detection
 * Commit 1
 * ============================================================
 */

const QuizApp = {

    elements: {},

    async init() {

        this.cacheElements();

        this.bindEvents();

        await this.restoreSession();

    },

    cacheElements() {

        this.elements.form =
            document.getElementById("quizVerificationForm");

        this.elements.omsId =
            document.getElementById("omsId");

        this.elements.password =
            document.getElementById("password");

        this.elements.submitButton =
            document.getElementById("verifyQuizButton");

    },

    bindEvents() {

        if (this.elements.form) {

            this.elements.form.addEventListener(
                "submit",
                this.handleVerification.bind(this)
            );

        }

    },

    async restoreSession() {

        try {

            if (
                typeof OmnoraAuth === "undefined" ||
                !OmnoraAuth.getCurrentSession
            ) {

                console.warn("OmnoraAuth unavailable.");

                return;

            }

            const session =
                await OmnoraAuth.getCurrentSession();

            if (!session) return;

            const user =
                await OmnoraAuth.getCurrentUser();

            if (!user) return;

            this.prefillOmsId(user);

        } catch (error) {

            console.error(
                "Session restore failed:",
                error
            );

        }

    },

    prefillOmsId(user) {

        if (!this.elements.omsId) return;
        this.elements.omsId.value = "";

        this.elements.omsId.removeAttribute("readonly");
        this.elements.omsId.removeAttribute("disabled");

    },
async handleVerification(event) {

    event.preventDefault();

    const omsId =
        this.elements.omsId.value.trim();

    const password =
        this.elements.password.value;

    if (!omsId || !password) {

        alert("Please enter OMS-ID and password.");

        return;

    }

    this.setLoading(true);

    try {

        const hasSession =
    await this.hasActiveSession();
        async hasActiveSession() {

    const session =
        await OmnoraAuth.getCurrentSession();

    return !!session;

},

    const session =
        await OmnoraAuth.getCurrentSession();

    return !!session;

},

        if (!hasSession) {

            const result =
                await OmnoraAuth.verifyStudentForQuiz({
    omsId,
    password
});

            if (!result.success) {

                alert(result.message);

                return;

            }

        }

        this.openQuiz();

    }
    openQuiz() {

    const verification =
        document.getElementById(
            "quizVerificationCard"
        );

    const quiz =
        document.getElementById(
            "quizContainer"
        );

    if (verification)
        verification.hidden = true;

    if (quiz)
        quiz.hidden = false;

},
    catch (error) {

        console.error(error);

        alert("Verification failed.");

    } finally {

        this.setLoading(false);

    }

}
setLoading(isLoading) {

    if (!this.elements.submitButton) return;

    this.elements.submitButton.disabled =
        isLoading;

    this.elements.submitButton.textContent =
        isLoading
            ? "Verifying..."
            : "Verify & Start Quiz";

            }
showSuccess(message){

    console.log(message);
    this.showSuccess("Verification successful.");

},
showError(message) {

    alert(message);

},
};

