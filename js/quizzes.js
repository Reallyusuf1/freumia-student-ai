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

        this.elements.omsId.value =
            user.omsId || "";

        this.elements.omsId.removeAttribute("readonly");
        this.elements.omsId.removeAttribute("disabled");

    },

    async handleVerification(event) {

        event.preventDefault();

        console.log(
            "Quiz verification will be implemented in Commit 2."
        );

    }

};

document.addEventListener(
    "DOMContentLoaded",
    () => QuizApp.init()
);

